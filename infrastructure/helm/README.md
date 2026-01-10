# HireHub Helm Charts

This directory contains Helm charts for deploying the HireHub AI-powered recruitment platform on Kubernetes.

## Overview

HireHub is a microservices-based recruitment platform consisting of 7 services:

| Service | Technology | Description |
|---------|-----------|-------------|
| user-service | Go/gRPC | User management and authentication |
| job-service | Java/Spring Boot/gRPC | Job posting management |
| resume-service | Python/FastAPI/gRPC | Resume management with PII removal |
| apply-service | Go/gRPC | Job application management |
| ai-service | Python/FastAPI | AI services (Bedrock AgentCore, RAG) |
| match-service | Python/FastAPI/gRPC | AI-powered job-candidate matching |
| notification-service | Go/Kafka | Notification processing (KEDA-enabled) |

## Chart Structure

```
infrastructure/helm/
├── hirehub/                    # Parent chart
│   ├── Chart.yaml              # Chart metadata with dependencies
│   ├── values.yaml             # Default values
│   ├── values-dev.yaml         # Development environment values
│   ├── values-prod.yaml        # Production environment values
│   ├── templates/
│   │   ├── _helpers.tpl        # Template helpers
│   │   ├── namespace.yaml      # Namespace creation
│   │   └── NOTES.txt           # Post-install notes
│   └── charts/                 # Subcharts
│       ├── user-service/
│       ├── job-service/
│       ├── resume-service/
│       ├── apply-service/
│       ├── ai-service/
│       ├── match-service/
│       └── notification-service/
└── README.md                   # This file
```

## Prerequisites

- Kubernetes 1.25+
- Helm 3.10+
- kubectl configured for your cluster

### Optional Components
- **KEDA** - For Kafka-based autoscaling (notification-service)
- **Istio** - For service mesh capabilities
- **Prometheus Operator** - For ServiceMonitor resources

## Installation

### Quick Start (Development)

```bash
# Navigate to helm directory
cd infrastructure/helm

# Install in development mode
helm install hirehub ./hirehub \
  -f ./hirehub/values-dev.yaml \
  --namespace hirehub-dev \
  --create-namespace
```

### Production Deployment

```bash
# Install in production mode
helm install hirehub ./hirehub \
  -f ./hirehub/values-prod.yaml \
  --namespace hirehub \
  --create-namespace
```

### Custom Configuration

```bash
# Install with custom values
helm install hirehub ./hirehub \
  -f ./hirehub/values.yaml \
  -f ./hirehub/values-prod.yaml \
  -f my-custom-values.yaml \
  --set global.region=us-west-2 \
  --namespace hirehub
```

## Upgrading

```bash
# Upgrade existing installation
helm upgrade hirehub ./hirehub \
  -f ./hirehub/values-prod.yaml \
  --namespace hirehub
```

## Uninstallation

```bash
# Uninstall the chart
helm uninstall hirehub --namespace hirehub

# Optionally delete the namespace
kubectl delete namespace hirehub
```

## Configuration

### Global Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Kubernetes namespace | `hirehub` |
| `global.createNamespace` | Create namespace if not exists | `true` |
| `global.environment` | Environment identifier | `dev` |
| `global.region` | AWS region | `ap-northeast-2` |
| `global.imageRegistry` | Container registry | `""` |
| `global.imagePullSecrets` | Image pull secrets | `[]` |

### Istio Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.istio.enabled` | Enable Istio injection | `false` |
| `global.istio.injection` | Sidecar injection mode | `enabled` |

### IRSA Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.irsa.enabled` | Enable IRSA | `true` |
| `global.irsa.roleArnPrefix` | IAM role ARN prefix | `arn:aws:iam::123456789012:role` |

### Database Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.database.host` | Database host | `aurora-postgresql.hirehub.local` |
| `global.database.port` | Database port | `5432` |
| `global.database.sslMode` | SSL mode | `require` |

### Kafka Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.kafka.bootstrapServers` | Kafka bootstrap servers | `msk-broker1:9092,...` |
| `global.kafka.securityProtocol` | Security protocol | `SASL_SSL` |

### Service-Specific Configuration

Each service can be individually configured. Example for user-service:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `user-service.enabled` | Enable service | `true` |
| `user-service.replicaCount` | Number of replicas | `2` |
| `user-service.image.repository` | Image repository | `hirehub/user-service` |
| `user-service.image.tag` | Image tag | `latest` |
| `user-service.resources.requests.cpu` | CPU request | `100m` |
| `user-service.resources.requests.memory` | Memory request | `128Mi` |
| `user-service.autoscaling.enabled` | Enable HPA | `true` |
| `user-service.podDisruptionBudget.enabled` | Enable PDB | `true` |

## Features

### Horizontal Pod Autoscaling (HPA)

All services support HPA based on CPU and memory utilization:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### KEDA Autoscaling (notification-service)

The notification-service uses KEDA for Kafka-based autoscaling:

```yaml
keda:
  enabled: true
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 2
  maxReplicaCount: 20
  kafka:
    topic: "hirehub.notifications"
    consumerGroup: "notification-service"
    lagThreshold: "100"
```

### Pod Disruption Budget (PDB)

Production deployments include PDBs to ensure availability:

```yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

### Service Monitors

Prometheus ServiceMonitors are created when monitoring is enabled:

```yaml
serviceMonitor:
  enabled: true
  interval: 30s
  scrapeTimeout: 10s
  path: /metrics
```

### IRSA (IAM Roles for Service Accounts)

Services are configured with IRSA for secure AWS access:

```yaml
serviceAccount:
  create: true
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/hirehub-user-service-role
```

## Deploying Individual Services

Each subchart can be deployed independently:

```bash
# Deploy only user-service
helm install user-service ./hirehub/charts/user-service \
  --namespace hirehub \
  --set global.namespace=hirehub
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n hirehub
kubectl describe pod <pod-name> -n hirehub
```

### View Logs

```bash
kubectl logs -f -l app.kubernetes.io/name=user-service -n hirehub
```

### Check HPA Status

```bash
kubectl get hpa -n hirehub
```

### Check KEDA ScaledObject

```bash
kubectl get scaledobject -n hirehub
kubectl describe scaledobject notification-service -n hirehub
```

### Validate Chart

```bash
helm lint ./hirehub
helm template hirehub ./hirehub -f ./hirehub/values-dev.yaml
```

## Development

### Testing Locally with Kind

```bash
# Create Kind cluster
kind create cluster --name hirehub-dev

# Install the chart
helm install hirehub ./hirehub \
  -f ./hirehub/values-dev.yaml \
  --namespace hirehub-dev \
  --create-namespace
```

### Dry Run

```bash
# Preview what will be installed
helm install hirehub ./hirehub \
  -f ./hirehub/values-prod.yaml \
  --dry-run --debug
```

## Security Considerations

1. **Secrets Management**: Use external-secrets or sealed-secrets in production
2. **Network Policies**: Consider adding network policies for service isolation
3. **Pod Security**: All pods run as non-root with read-only root filesystem
4. **mTLS**: Enable gRPC mTLS in production for secure inter-service communication
5. **IRSA**: Use IRSA instead of static credentials for AWS access

## License

Copyright 2024 HireHub Team
