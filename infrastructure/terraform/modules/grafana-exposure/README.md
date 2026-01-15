# Grafana Exposure Module

Exposes Grafana via NLB + CloudFront with Security Group that only allows CloudFront IPs.

## Architecture

```
┌─────────┐    ┌─────────────────────────────────┐    ┌────────────┐    ┌───────┐
│ Grafana │───▶│            NLB                   │───▶│ CloudFront │───▶│ Users │
│  (Pod)  │    │  ┌─────────────────────────┐    │    │   (CDN)    │    │       │
└─────────┘    │  │ Security Group          │    │    └────────────┘    └───────┘
               │  │ Allow: CloudFront only  │    │
               │  │ (Managed Prefix List)   │    │
               │  └─────────────────────────┘    │
               └─────────────────────────────────┘
```

## Deployment Steps

### Step 1: Create Security Group (Terraform)

```hcl
module "grafana_sg" {
  source = "../../modules/grafana-exposure"

  environment    = "dev"
  project_name   = "hirehub"
  vpc_id         = module.vpc.vpc_id
  eks_node_cidrs = module.vpc.private_subnet_cidrs

  # CloudFront will be created later
  nlb_dns_name = "placeholder.elb.amazonaws.com"
}
```

```bash
terraform apply -target=module.grafana_sg
```

### Step 2: Update Grafana Service with SG ID (K8s)

Update the Grafana Helm values with the Security Group ID:

```yaml
service:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-security-groups: "sg-xxxxxxxx"
```

Apply via ArgoCD sync.

### Step 3: Get NLB DNS Name

```bash
kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Step 4: Update CloudFront with NLB DNS (Terraform)

Update the module with actual NLB DNS:

```hcl
module "grafana_exposure" {
  source = "../../modules/grafana-exposure"

  nlb_dns_name = "k8s-monitoring-grafana-xxxxxxxx.elb.ap-northeast-2.amazonaws.com"
  # ... other variables
}
```

```bash
terraform apply
```

## Inputs

| Name | Description | Type | Default |
|------|-------------|------|---------|
| environment | Environment name | string | - |
| project_name | Project name | string | "hirehub" |
| vpc_id | VPC ID | string | - |
| eks_node_cidrs | EKS node CIDR blocks | list(string) | - |
| nlb_dns_name | NLB DNS name | string | - |
| grafana_domain | Custom domain (optional) | string | "" |

## Outputs

| Name | Description |
|------|-------------|
| security_group_id | SG ID to use in K8s Service annotation |
| cloudfront_domain_name | CloudFront domain for access |
| grafana_url | Full URL to access Grafana |

## Security

- NLB Security Group allows:
  - CloudFront managed prefix list (port 80) - User traffic
  - VPC CIDR (port 80) - NLB health checks
- CloudFront provides HTTPS termination
- Optional WAF integration for additional protection

## Important: EKS Cluster Security Group

You must also add a rule to the EKS cluster security group to allow traffic from VPC CIDR on the Grafana pod port (3000):

```bash
# Get EKS cluster security group
EKS_SG=$(aws eks describe-cluster --name <cluster-name> --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' --output text)

# Add rule for Grafana NLB health checks
aws ec2 authorize-security-group-ingress \
  --group-id $EKS_SG \
  --ip-permissions "IpProtocol=tcp,FromPort=3000,ToPort=3000,IpRanges=[{CidrIp=<VPC_CIDR>,Description=NLB health checks for Grafana}]"
```
