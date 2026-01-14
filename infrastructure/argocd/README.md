# ArgoCD GitOps 배포 가이드

이 문서는 EKS managed ArgoCD를 사용한 HireHub 플랫폼 배포 방법을 설명합니다.

## 사전 요구사항

- EKS 클러스터 (ArgoCD Capability 활성화)
- kubectl 설치 및 클러스터 접근 권한
- AWS CLI 설정 완료

## 1. RBAC 설정

EKS managed ArgoCD는 기본적으로 Application 생성에 제한이 있습니다. 다음 명령으로 RBAC를 설정합니다:

```bash
kubectl patch configmap argocd-rbac-cm -n argocd --type=merge -p '{
  "data": {
    "policy.csv": "g, *, role:admin\np, role:admin, applications, *, */*, allow\np, role:admin, projects, *, *, allow",
    "policy.default": "role:admin"
  }
}'
```

## 2. AppProject 생성

HireHub 전용 프로젝트를 생성합니다 (EKS managed ArgoCD에서는 `default` 프로젝트 사용 권장):

```bash
kubectl apply -f projects/hirehub.yaml
```

> **참고**: EKS managed ArgoCD에서는 커스텀 AppProject 사용에 제한이 있을 수 있습니다.
> 문제 발생 시 Application의 `spec.project`를 `default`로 변경하세요.

## 3. GitHub Repository 연결 (Private Repository의 경우)

### 3.1 SSH Key 방식

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "argocd@hirehub" -f ~/.ssh/argocd_hirehub

# GitHub에 Deploy Key 등록 (Settings > Deploy keys)
cat ~/.ssh/argocd_hirehub.pub

# ArgoCD에 Repository Secret 생성
kubectl create secret generic hirehub-repo-creds -n argocd \
  --from-file=sshPrivateKey=$HOME/.ssh/argocd_hirehub \
  --from-literal=url=git@github.com:YOUR_ORG/hirehub.git \
  --from-literal=type=git

kubectl label secret hirehub-repo-creds -n argocd \
  argocd.argoproj.io/secret-type=repository
```

### 3.2 HTTPS + Token 방식

```bash
kubectl create secret generic hirehub-repo-creds -n argocd \
  --from-literal=url=https://github.com/YOUR_ORG/hirehub.git \
  --from-literal=username=git \
  --from-literal=password=ghp_YOUR_GITHUB_TOKEN \
  --from-literal=type=git

kubectl label secret hirehub-repo-creds -n argocd \
  argocd.argoproj.io/secret-type=repository
```

### 3.3 Repository 연결 확인

```bash
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=repository
```

## 4. Applications 배포 순서

### 4.1 Kong API Gateway (namespace: kong)

```bash
kubectl apply -f applications/kong.yaml
```

확인:
```bash
kubectl get applications -n argocd kong
kubectl get pods -n kong
```

### 4.2 Kong Plugins

```bash
kubectl apply -f applications/kong-plugins.yaml
```

### 4.3 HireHub Services (namespace: hirehub)

```bash
kubectl apply -f applications/hirehub-services.yaml
```

### 4.4 Observability Stack (선택사항)

```bash
kubectl apply -f applications/observability.yaml
```

## 5. Application 상태 확인

```bash
# 모든 Application 상태
kubectl get applications -n argocd

# 상세 상태 확인
kubectl get application <app-name> -n argocd -o yaml

# 에러 조건 확인
kubectl get application <app-name> -n argocd -o jsonpath='{.status.conditions[*].message}'
```

## 6. 트러블슈팅

### "application is not permitted to use project" 에러

1. RBAC ConfigMap 업데이트:
```bash
kubectl patch configmap argocd-rbac-cm -n argocd --type=merge -p '{
  "data": {
    "policy.csv": "g, *, role:admin\np, role:admin, applications, *, */*, allow",
    "policy.default": "role:admin"
  }
}'
```

2. Application의 project를 `default`로 변경:
```bash
kubectl patch application <app-name> -n argocd --type='json' \
  -p='[{"op": "replace", "path": "/spec/project", "value": "default"}]'
```

### Kong Pod CrashLoopBackOff

DB-less 모드에서 `declarative_config` 경로 오류일 수 있습니다.
Kong Ingress Controller 사용 시 `declarative_config` 환경변수를 제거하세요.

### Sync 실패

```bash
# Application 강제 Sync
kubectl patch application <app-name> -n argocd --type=merge \
  -p '{"operation": {"sync": {"revision": "HEAD"}}}'

# Application 삭제 후 재생성 (리소스 유지)
kubectl delete application <app-name> -n argocd
kubectl apply -f applications/<app-name>.yaml
```

## 7. 디렉토리 구조

```
infrastructure/argocd/
├── README.md              # 이 파일
├── install/               # ArgoCD 설치 값 (EKS Capability 사용 시 불필요)
│   └── values.yaml
├── projects/              # AppProject 정의
│   └── hirehub.yaml       # HireHub 프로젝트
├── applications/          # Application 매니페스트
│   ├── kong.yaml          # Kong API Gateway (ns: kong)
│   ├── kong-plugins.yaml  # Kong CRD plugins
│   ├── hirehub-services.yaml  # HireHub 마이크로서비스 (ns: hirehub)
│   ├── observability.yaml # 모니터링 스택
│   ├── karpenter.yaml     # Karpenter 오토스케일러
│   ├── keda.yaml          # KEDA 이벤트 기반 스케일러
│   └── alb-controller.yaml # AWS ALB Controller
├── applicationsets/       # 멀티 환경 배포
│   └── hirehub-envs.yaml  # dev/prod ApplicationSet
└── kong-plugins/          # Kong plugin CRD 매니페스트
    ├── rate-limiting.yaml
    ├── cors.yaml
    ├── jwt-auth.yaml
    └── api-routes.yaml
```

## 8. Namespace 정리

| Application | Namespace | 설명 |
|-------------|-----------|------|
| kong | kong | Kong API Gateway |
| kong-plugins | kong | Kong plugin CRDs |
| hirehub-services | hirehub | HireHub 마이크로서비스 |
| observability | monitoring | Prometheus, Grafana 등 |
| karpenter | kube-system | Karpenter controller |
| keda | keda | KEDA controller |
| alb-controller | kube-system | AWS Load Balancer Controller |

## 9. EKS managed ArgoCD 특이사항

1. **프로젝트 제한**: 커스텀 AppProject 사용 시 권한 에러 발생 가능. `default` 프로젝트 사용 권장.

2. **RBAC 설정 필요**: `argocd-rbac-cm` ConfigMap에 명시적 권한 추가 필요.

3. **Identity Center 연동**: AWS IAM Identity Center를 통한 SSO 인증 사용.

4. **Custom URL 미지원**: 외부 커스텀 도메인 OAuth 콜백 미지원 (EKS 제공 URL 사용).

5. **Destination 설정**:
   - `server: https://kubernetes.default.svc`는 **지원되지 않음**
   - 반드시 클러스터 등록 후 `name: in-cluster` 사용
   - 클러스터 등록 시 `server` 필드에 **EKS Cluster ARN** 사용 필수

## 10. `name: in-cluster` 사용을 위한 설정 (필수)

AWS EKS ArgoCD Capability에서는 **클러스터 등록이 필수**입니다.
`server: https://kubernetes.default.svc`는 지원되지 않습니다.

### 10.1 default 프로젝트 업데이트

```bash
kubectl patch appproject default -n argocd --type=merge -p '{
  "spec": {
    "destinations": [
      {"namespace": "*", "server": "*"},
      {"namespace": "*", "name": "*"}
    ]
  }
}'
```

### 10.2 클러스터 등록 (Kubernetes Secret 방식)

**중요**: `server` 필드에 **EKS Cluster ARN**을 사용해야 합니다.

```bash
# 클러스터 ARN 확인
CLUSTER_ARN=$(aws eks describe-cluster --name <cluster-name> --query 'cluster.arn' --output text --region ap-northeast-2)

# 클러스터 Secret 생성
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: in-cluster
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: cluster
stringData:
  name: in-cluster
  server: "$CLUSTER_ARN"
  project: default
EOF
```

### 10.3 클러스터 등록 (ArgoCD CLI 방식)

```bash
argocd cluster add "$CLUSTER_ARN" \
  --aws-cluster-name "$CLUSTER_ARN" \
  --name in-cluster \
  --project default
```

### 10.4 Application에서 사용

```yaml
spec:
  destination:
    name: in-cluster      # 등록된 클러스터 이름 사용
    namespace: kong
```

### 10.5 클러스터 등록 확인

```bash
# Secret 확인
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=cluster

# ArgoCD UI에서 확인
# Settings > Clusters 메뉴에서 in-cluster 확인
```
