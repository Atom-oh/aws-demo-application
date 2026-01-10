# VPC Module for HireHub
# Creates a multi-AZ VPC with public and private subnets

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  common_tags = merge(var.tags, {
    Module = "vpc"
  })
}

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                           = "${var.environment}-${var.project_name}-public-${local.azs[count.index]}"
    "kubernetes.io/role/elb"                       = "1"
    "kubernetes.io/cluster/${var.environment}-${var.project_name}-eks" = "shared"
  })
}

# Private Subnets (for EKS/ECS workloads)
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name                                           = "${var.environment}-${var.project_name}-private-${local.azs[count.index]}"
    "kubernetes.io/role/internal-elb"              = "1"
    "kubernetes.io/cluster/${var.environment}-${var.project_name}-eks" = "shared"
    "karpenter.sh/discovery"                       = "${var.environment}-${var.project_name}-eks"
  })
}

# Database Subnets (isolated)
resource "aws_subnet" "database" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + (var.az_count * 2))
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-database-${local.azs[count.index]}"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : var.az_count) : 0
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : var.az_count) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-public-rt"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : var.az_count) : 1
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-private-rt-${count.index + 1}"
  })
}

# Private Routes to NAT Gateway
resource "aws_route" "private_nat_gateway" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : var.az_count) : 0

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id
}

# Database Route Table (isolated, no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-database-rt"
  })
}

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : min(count.index, length(aws_route_table.private) - 1)].id
}

# Database Subnet Route Table Associations
resource "aws_route_table_association" "database" {
  count = var.az_count

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-db-subnet-group"
  })
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-${var.project_name}-cache-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-cache-subnet-group"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-flow-log"
  })
}

resource "aws_cloudwatch_log_group" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc-flow-log/${var.environment}-${var.project_name}"
  retention_in_days = var.flow_log_retention_days

  tags = local.common_tags
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.environment}-${var.project_name}-vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.environment}-${var.project_name}-vpc-flow-log-policy"
  role = aws_iam_role.flow_log[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Endpoints for AWS Services
resource "aws_vpc_endpoint" "s3" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(aws_route_table.private[*].id, [aws_route_table.database.id])

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(aws_route_table.private[*].id, [aws_route_table.database.id])

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-dynamodb-endpoint"
  })
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  count = var.enable_vpc_endpoints ? 1 : 0

  name        = "${var.environment}-${var.project_name}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-vpc-endpoints-sg"
  })
}

# Interface VPC Endpoints
resource "aws_vpc_endpoint" "ecr_api" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-secretsmanager-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-logs-endpoint"
  })
}
