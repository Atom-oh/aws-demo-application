# MSK Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs (one per AZ)"
  type        = list(string)
}

variable "kafka_version" {
  description = "Kafka version"
  type        = string
  default     = "3.5.1"
}

variable "number_of_broker_nodes" {
  description = "Number of broker nodes"
  type        = number
  default     = 3
}

variable "broker_instance_type" {
  description = "Broker instance type"
  type        = string
  default     = "kafka.m5.large"
}

variable "broker_ebs_volume_size" {
  description = "Broker EBS volume size in GB"
  type        = number
  default     = 100
}

variable "provisioned_throughput_enabled" {
  description = "Enable provisioned throughput"
  type        = bool
  default     = false
}

variable "volume_throughput" {
  description = "Volume throughput in MiB/s"
  type        = number
  default     = 250
}

variable "server_properties" {
  description = "Kafka server properties"
  type        = string
  default     = <<EOF
auto.create.topics.enable=false
default.replication.factor=3
min.insync.replicas=2
num.partitions=3
log.retention.hours=168
EOF
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
  default     = null
}

variable "encryption_in_transit_client_broker" {
  description = "Encryption setting for client-broker"
  type        = string
  default     = "TLS"
}

variable "encryption_in_transit_in_cluster" {
  description = "Encryption in-cluster"
  type        = bool
  default     = true
}

variable "sasl_iam_enabled" {
  description = "Enable SASL/IAM authentication"
  type        = bool
  default     = true
}

variable "sasl_scram_enabled" {
  description = "Enable SASL/SCRAM authentication"
  type        = bool
  default     = false
}

variable "unauthenticated_access_enabled" {
  description = "Enable unauthenticated access"
  type        = bool
  default     = false
}

variable "cloudwatch_logs_enabled" {
  description = "Enable CloudWatch logging"
  type        = bool
  default     = true
}

variable "s3_logs_enabled" {
  description = "Enable S3 logging"
  type        = bool
  default     = false
}

variable "prometheus_jmx_exporter_enabled" {
  description = "Enable Prometheus JMX exporter"
  type        = bool
  default     = true
}

variable "prometheus_node_exporter_enabled" {
  description = "Enable Prometheus node exporter"
  type        = bool
  default     = true
}

variable "enhanced_monitoring" {
  description = "Enhanced monitoring level"
  type        = string
  default     = "PER_TOPIC_PER_BROKER"
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "allowed_security_group_ids" {
  description = "Allowed security groups"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
