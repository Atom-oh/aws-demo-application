# Kong Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "create_namespace" {
  description = "Create Kong namespace"
  type        = bool
  default     = true
}

variable "kong_version" {
  description = "Kong version"
  type        = string
  default     = "3.5"
}

variable "replicas" {
  description = "Number of replicas"
  type        = number
  default     = 2
}

variable "kong_iam_role_arn" {
  description = "IAM role ARN for Kong service account"
  type        = string
  default     = null
}

# Database
variable "database_type" {
  description = "Database type (postgres or off)"
  type        = string
  default     = "postgres"
}

variable "postgres_host" {
  description = "PostgreSQL host"
  type        = string
}

variable "postgres_port" {
  description = "PostgreSQL port"
  type        = number
  default     = 5432
}

variable "postgres_user" {
  description = "PostgreSQL user"
  type        = string
  default     = "kong"
}

variable "postgres_database" {
  description = "PostgreSQL database"
  type        = string
  default     = "kong"
}

variable "postgres_secret_name" {
  description = "Kubernetes secret name for PostgreSQL password"
  type        = string
}

# Resources
variable "resources_requests_cpu" {
  description = "CPU requests"
  type        = string
  default     = "500m"
}

variable "resources_requests_memory" {
  description = "Memory requests"
  type        = string
  default     = "512Mi"
}

variable "resources_limits_cpu" {
  description = "CPU limits"
  type        = string
  default     = "2000m"
}

variable "resources_limits_memory" {
  description = "Memory limits"
  type        = string
  default     = "2Gi"
}

# Service
variable "service_type" {
  description = "Kubernetes service type"
  type        = string
  default     = "LoadBalancer"
}

variable "service_annotations" {
  description = "Service annotations"
  type        = map(string)
  default = {
    "service.beta.kubernetes.io/aws-load-balancer-type"            = "nlb"
    "service.beta.kubernetes.io/aws-load-balancer-scheme"          = "internet-facing"
    "service.beta.kubernetes.io/aws-load-balancer-ssl-cert"        = ""
    "service.beta.kubernetes.io/aws-load-balancer-ssl-ports"       = "443"
    "service.beta.kubernetes.io/aws-load-balancer-backend-protocol" = "tcp"
  }
}

# Logging
variable "log_level" {
  description = "Kong log level"
  type        = string
  default     = "notice"
}

# Rate Limiting
variable "enable_rate_limiting" {
  description = "Enable rate limiting plugin"
  type        = bool
  default     = true
}

variable "rate_limit_per_minute" {
  description = "Rate limit per minute"
  type        = number
  default     = 100
}

variable "redis_host" {
  description = "Redis host for rate limiting"
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  default     = ""
  sensitive   = true
}

# Circuit Breaker
variable "enable_circuit_breaker" {
  description = "Enable circuit breaker plugin"
  type        = bool
  default     = true
}

# CORS
variable "enable_cors" {
  description = "Enable CORS plugin"
  type        = bool
  default     = true
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

# JWT
variable "enable_jwt_auth" {
  description = "Enable JWT authentication plugin"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
