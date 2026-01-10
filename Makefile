# HireHub Makefile
# AI-powered Recruitment Platform

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Service ports
USER_PORT := 8001
JOB_PORT := 8002
RESUME_PORT := 8003
APPLY_PORT := 8004
MATCH_PORT := 8005
AI_PORT := 8006
NOTIFICATION_PORT := 8007
WEB_PORT := 3001
ADMIN_PORT := 3000

# gRPC ports (internal)
USER_GRPC_PORT := 9001
JOB_GRPC_PORT := 9002
RESUME_GRPC_PORT := 9003
APPLY_GRPC_PORT := 9004
MATCH_GRPC_PORT := 9005
AI_GRPC_PORT := 9006
NOTIFICATION_GRPC_PORT := 9007

# Directories
PROTO_DIR := proto
SERVICES_DIR := services
INFRA_DIR := infrastructure
SCRIPTS_DIR := scripts

# Docker registry
DOCKER_REGISTRY ?= hirehub
IMAGE_TAG ?= latest

# Services list
SERVICES := user job resume apply match ai notification
GO_SERVICES := user apply notification
PYTHON_SERVICES := resume match ai
JAVA_SERVICES := job

.PHONY: help cluster-up cluster-down proto proto-clean \
        build-all build-user-service build-job-service build-resume-service \
        build-apply-service build-match-service build-ai-service build-notification-service \
        run-user-service run-job-service run-resume-service \
        run-apply-service run-match-service run-ai-service \
        run-notification-service run-web-frontend run-admin-dashboard \
        run-all stop-all \
        docker-build-all docker-build-user docker-build-job docker-build-resume \
        docker-build-apply docker-build-match docker-build-ai docker-build-notification \
        docker-push-all \
        deploy-all deploy-user-service deploy-job-service deploy-resume-service \
        deploy-apply-service deploy-match-service deploy-ai-service deploy-notification-service \
        test-all test-user-service test-job-service test-resume-service \
        test-apply-service test-match-service test-ai-service test-notification-service \
        migrate-up migrate-down migrate-create \
        seed-all seed-users seed-companies seed-jobs seed-resumes seed-applies seed-reset \
        lint lint-go lint-python lint-java \
        fmt fmt-go fmt-python \
        clean deps status logs

##@ General

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n${BLUE}HireHub${NC} - AI-powered Recruitment Platform\n\n${YELLOW}Usage:${NC}\n  make ${GREEN}<target>${NC}\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  ${GREEN}%-25s${NC} %s\n", $$1, $$2 } /^##@/ { printf "\n${YELLOW}%s${NC}\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Cluster Management

cluster-up: ## Create Kind cluster
	@echo "${GREEN}Creating Kind cluster...${NC}"
	@kind create cluster --name hirehub --config $(INFRA_DIR)/kind/cluster-config.yaml || true
	@kubectl cluster-info --context kind-hirehub
	@echo "${GREEN}Kind cluster created successfully!${NC}"

cluster-down: ## Delete Kind cluster
	@echo "${RED}Deleting Kind cluster...${NC}"
	@kind delete cluster --name hirehub
	@echo "${GREEN}Kind cluster deleted!${NC}"

cluster-status: ## Check cluster status
	@echo "${BLUE}Cluster Status:${NC}"
	@kubectl cluster-info --context kind-hirehub 2>/dev/null || echo "${RED}Cluster not running${NC}"

##@ Proto Compilation

proto: ## Compile all proto files (Go, Python, Java)
	@echo "${GREEN}Compiling proto files...${NC}"
	@./$(SCRIPTS_DIR)/generate-proto.sh

proto-go: ## Compile proto files for Go services only
	@echo "${GREEN}Compiling Go proto files...${NC}"
	@./$(SCRIPTS_DIR)/generate-proto.sh --go-only

proto-python: ## Compile proto files for Python services only
	@echo "${GREEN}Compiling Python proto files...${NC}"
	@./$(SCRIPTS_DIR)/generate-proto.sh --python-only

proto-java: ## Compile proto files for Java service only
	@echo "${GREEN}Compiling Java proto files...${NC}"
	@./$(SCRIPTS_DIR)/generate-proto.sh --java-only

proto-install: ## Install buf and proto generation dependencies
	@echo "${GREEN}Installing proto generation dependencies...${NC}"
	@./$(SCRIPTS_DIR)/generate-proto.sh --install-buf

proto-clean: ## Clean generated proto files
	@echo "${YELLOW}Cleaning generated proto files...${NC}"
	@rm -rf $(PROTO_DIR)/gen
	@echo "${GREEN}Proto files cleaned!${NC}"

##@ Build (Local Development)

build-all: ## Build all services locally
	@echo "${GREEN}Building all services...${NC}"
	@$(MAKE) build-user-service
	@$(MAKE) build-apply-service
	@$(MAKE) build-notification-service
	@$(MAKE) build-job-service
	@$(MAKE) build-resume-service
	@$(MAKE) build-match-service
	@$(MAKE) build-ai-service
	@echo "${GREEN}All services built!${NC}"

build-user-service: ## Build user-service (Go)
	@echo "${BLUE}Building user-service...${NC}"
	@cd $(SERVICES_DIR)/user-service && go build -o bin/server ./cmd/main.go
	@echo "${GREEN}user-service built!${NC}"

build-job-service: ## Build job-service (Java/Spring Boot)
	@echo "${BLUE}Building job-service...${NC}"
	@cd $(SERVICES_DIR)/job-service && ./gradlew build -x test 2>/dev/null || ./mvnw package -DskipTests 2>/dev/null || echo "Build tools not found"
	@echo "${GREEN}job-service built!${NC}"

build-resume-service: ## Build resume-service (Python - install deps)
	@echo "${BLUE}Building resume-service...${NC}"
	@cd $(SERVICES_DIR)/resume-service && pip install -r requirements.txt -q
	@echo "${GREEN}resume-service built!${NC}"

build-apply-service: ## Build apply-service (Go)
	@echo "${BLUE}Building apply-service...${NC}"
	@cd $(SERVICES_DIR)/apply-service && go build -o bin/server ./cmd/main.go
	@echo "${GREEN}apply-service built!${NC}"

build-match-service: ## Build match-service (Python - install deps)
	@echo "${BLUE}Building match-service...${NC}"
	@cd $(SERVICES_DIR)/match-service && pip install -r requirements.txt -q 2>/dev/null || true
	@echo "${GREEN}match-service built!${NC}"

build-ai-service: ## Build ai-service (Python - install deps)
	@echo "${BLUE}Building ai-service...${NC}"
	@cd $(SERVICES_DIR)/ai-service && pip install -r requirements.txt -q 2>/dev/null || true
	@echo "${GREEN}ai-service built!${NC}"

build-notification-service: ## Build notification-service (Go)
	@echo "${BLUE}Building notification-service...${NC}"
	@cd $(SERVICES_DIR)/notification-service && go build -o bin/server ./cmd/main.go
	@echo "${GREEN}notification-service built!${NC}"

##@ Service Execution (Development)

run-user-service: ## Run user-service (Go, port 8001)
	@echo "${GREEN}Starting user-service on port $(USER_PORT)...${NC}"
	@cd $(SERVICES_DIR)/user-service && go run cmd/main.go

run-job-service: ## Run job-service (Java/Spring Boot, port 8002)
	@echo "${GREEN}Starting job-service on port $(JOB_PORT)...${NC}"
	@cd $(SERVICES_DIR)/job-service && ./gradlew bootRun || ./mvnw spring-boot:run

run-resume-service: ## Run resume-service (Python/FastAPI, port 8003)
	@echo "${GREEN}Starting resume-service on port $(RESUME_PORT)...${NC}"
	@cd $(SERVICES_DIR)/resume-service && uvicorn app.main:app --reload --port $(RESUME_PORT)

run-apply-service: ## Run apply-service (Go, port 8004)
	@echo "${GREEN}Starting apply-service on port $(APPLY_PORT)...${NC}"
	@cd $(SERVICES_DIR)/apply-service && go run cmd/main.go

run-match-service: ## Run match-service (Python/FastAPI, port 8005)
	@echo "${GREEN}Starting match-service on port $(MATCH_PORT)...${NC}"
	@cd $(SERVICES_DIR)/match-service && uvicorn app.main:app --reload --port $(MATCH_PORT)

run-ai-service: ## Run ai-service (Python/FastAPI, port 8006)
	@echo "${GREEN}Starting ai-service on port $(AI_PORT)...${NC}"
	@cd $(SERVICES_DIR)/ai-service && uvicorn app.main:app --reload --port $(AI_PORT)

run-notification-service: ## Run notification-service (Go, port 8007)
	@echo "${GREEN}Starting notification-service on port $(NOTIFICATION_PORT)...${NC}"
	@cd $(SERVICES_DIR)/notification-service && go run cmd/main.go

run-web-frontend: ## Run web-frontend (Next.js, port 3001)
	@echo "${GREEN}Starting web-frontend on port $(WEB_PORT)...${NC}"
	@cd web-frontend && npm run dev -- -p $(WEB_PORT)

run-admin-dashboard: ## Run admin-dashboard (Next.js, port 3000)
	@echo "${GREEN}Starting admin-dashboard on port $(ADMIN_PORT)...${NC}"
	@cd admin-dashboard && npm run dev -- -p $(ADMIN_PORT)

run-all: ## Run all services with docker-compose
	@echo "${GREEN}Starting all services with docker-compose...${NC}"
	@docker-compose up -d
	@echo "${GREEN}All services started! Run 'make logs-compose' to view logs${NC}"

stop-all: ## Stop all docker-compose services
	@echo "${YELLOW}Stopping all services...${NC}"
	@docker-compose down
	@echo "${GREEN}All services stopped!${NC}"

logs-compose: ## View docker-compose logs
	@docker-compose logs -f

##@ Deployment

deploy-all: ## Deploy all services to cluster
	@echo "${GREEN}Deploying all services...${NC}"
	@kubectl apply -f $(INFRA_DIR)/k8s/namespace.yaml 2>/dev/null || true
	@kubectl apply -f $(INFRA_DIR)/k8s/configmaps/ 2>/dev/null || true
	@kubectl apply -f $(INFRA_DIR)/k8s/secrets/ 2>/dev/null || true
	@for svc in user job resume apply match ai notification; do \
		echo "${BLUE}Deploying $$svc-service...${NC}"; \
		kubectl apply -f $(SERVICES_DIR)/$$svc-service/k8s/ 2>/dev/null || true; \
	done
	@echo "${GREEN}All services deployed!${NC}"

deploy-user-service: ## Deploy user-service
	@echo "${BLUE}Deploying user-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/user-service/k8s/

deploy-job-service: ## Deploy job-service
	@echo "${BLUE}Deploying job-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/job-service/k8s/

deploy-resume-service: ## Deploy resume-service
	@echo "${BLUE}Deploying resume-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/resume-service/k8s/

deploy-apply-service: ## Deploy apply-service
	@echo "${BLUE}Deploying apply-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/apply-service/k8s/

deploy-match-service: ## Deploy match-service
	@echo "${BLUE}Deploying match-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/match-service/k8s/

deploy-ai-service: ## Deploy ai-service
	@echo "${BLUE}Deploying ai-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/ai-service/k8s/

deploy-notification-service: ## Deploy notification-service
	@echo "${BLUE}Deploying notification-service...${NC}"
	@kubectl apply -f $(SERVICES_DIR)/notification-service/k8s/

##@ Testing

test-all: ## Run all tests
	@echo "${GREEN}Running all tests...${NC}"
	@$(MAKE) test-user-service || true
	@$(MAKE) test-job-service || true
	@$(MAKE) test-resume-service || true
	@$(MAKE) test-apply-service || true
	@$(MAKE) test-match-service || true
	@$(MAKE) test-ai-service || true
	@$(MAKE) test-notification-service || true
	@echo "${GREEN}All tests completed!${NC}"

test-user-service: ## Test user-service
	@echo "${BLUE}Testing user-service...${NC}"
	@cd $(SERVICES_DIR)/user-service && go test -v ./...

test-job-service: ## Test job-service
	@echo "${BLUE}Testing job-service...${NC}"
	@cd $(SERVICES_DIR)/job-service && ./gradlew test || ./mvnw test

test-resume-service: ## Test resume-service
	@echo "${BLUE}Testing resume-service...${NC}"
	@cd $(SERVICES_DIR)/resume-service && pytest -v

test-apply-service: ## Test apply-service
	@echo "${BLUE}Testing apply-service...${NC}"
	@cd $(SERVICES_DIR)/apply-service && go test -v ./...

test-match-service: ## Test match-service
	@echo "${BLUE}Testing match-service...${NC}"
	@cd $(SERVICES_DIR)/match-service && pytest -v

test-ai-service: ## Test ai-service
	@echo "${BLUE}Testing ai-service...${NC}"
	@cd $(SERVICES_DIR)/ai-service && pytest -v

test-notification-service: ## Test notification-service
	@echo "${BLUE}Testing notification-service...${NC}"
	@cd $(SERVICES_DIR)/notification-service && go test -v ./...

##@ Mock Data / Seeding

seed-all: seed-users seed-companies seed-jobs seed-resumes seed-applies ## Seed all mock data
	@echo "${GREEN}All mock data seeded!${NC}"

seed-users: ## Seed user data
	@echo "${BLUE}Seeding users...${NC}"
	@cd scripts && ./seed-users.sh 2>/dev/null || python seed_data.py --type users 2>/dev/null || echo "Seed script not found"

seed-companies: ## Seed company data
	@echo "${BLUE}Seeding companies...${NC}"
	@cd scripts && ./seed-companies.sh 2>/dev/null || python seed_data.py --type companies 2>/dev/null || echo "Seed script not found"

seed-jobs: ## Seed job postings
	@echo "${BLUE}Seeding job postings...${NC}"
	@cd scripts && ./seed-jobs.sh 2>/dev/null || python seed_data.py --type jobs 2>/dev/null || echo "Seed script not found"

seed-resumes: ## Seed resume data
	@echo "${BLUE}Seeding resumes...${NC}"
	@cd scripts && ./seed-resumes.sh 2>/dev/null || python seed_data.py --type resumes 2>/dev/null || echo "Seed script not found"

seed-applies: ## Seed application data
	@echo "${BLUE}Seeding applications...${NC}"
	@cd scripts && ./seed-applies.sh 2>/dev/null || python seed_data.py --type applies 2>/dev/null || echo "Seed script not found"

seed-reset: ## Reset all seeded data
	@echo "${RED}Resetting all mock data...${NC}"
	@cd scripts && ./seed-reset.sh 2>/dev/null || python seed_data.py --reset 2>/dev/null || echo "Reset script not found"
	@echo "${GREEN}Mock data reset complete!${NC}"

##@ Docker

docker-build-all: ## Build all Docker images
	@echo "${GREEN}Building all Docker images...${NC}"
	@for svc in $(SERVICES); do \
		echo "${BLUE}Building $$svc-service...${NC}"; \
		docker build -t $(DOCKER_REGISTRY)/$$svc-service:$(IMAGE_TAG) $(SERVICES_DIR)/$$svc-service/; \
	done
	@echo "${GREEN}All Docker images built!${NC}"

docker-build-user: ## Build user-service Docker image
	@echo "${BLUE}Building user-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/user-service:$(IMAGE_TAG) $(SERVICES_DIR)/user-service/

docker-build-job: ## Build job-service Docker image
	@echo "${BLUE}Building job-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/job-service:$(IMAGE_TAG) $(SERVICES_DIR)/job-service/

docker-build-resume: ## Build resume-service Docker image
	@echo "${BLUE}Building resume-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/resume-service:$(IMAGE_TAG) $(SERVICES_DIR)/resume-service/

docker-build-apply: ## Build apply-service Docker image
	@echo "${BLUE}Building apply-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/apply-service:$(IMAGE_TAG) $(SERVICES_DIR)/apply-service/

docker-build-match: ## Build match-service Docker image
	@echo "${BLUE}Building match-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/match-service:$(IMAGE_TAG) $(SERVICES_DIR)/match-service/

docker-build-ai: ## Build ai-service Docker image
	@echo "${BLUE}Building ai-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/ai-service:$(IMAGE_TAG) $(SERVICES_DIR)/ai-service/

docker-build-notification: ## Build notification-service Docker image
	@echo "${BLUE}Building notification-service Docker image...${NC}"
	@docker build -t $(DOCKER_REGISTRY)/notification-service:$(IMAGE_TAG) $(SERVICES_DIR)/notification-service/

docker-push-all: ## Push all Docker images to registry
	@echo "${GREEN}Pushing all Docker images...${NC}"
	@for svc in $(SERVICES); do \
		echo "${BLUE}Pushing $$svc-service...${NC}"; \
		docker push $(DOCKER_REGISTRY)/$$svc-service:$(IMAGE_TAG); \
	done
	@echo "${GREEN}All Docker images pushed!${NC}"

docker-push-user: ## Push user-service Docker image
	@docker push $(DOCKER_REGISTRY)/user-service:$(IMAGE_TAG)

docker-push-job: ## Push job-service Docker image
	@docker push $(DOCKER_REGISTRY)/job-service:$(IMAGE_TAG)

docker-push-resume: ## Push resume-service Docker image
	@docker push $(DOCKER_REGISTRY)/resume-service:$(IMAGE_TAG)

docker-push-apply: ## Push apply-service Docker image
	@docker push $(DOCKER_REGISTRY)/apply-service:$(IMAGE_TAG)

docker-push-match: ## Push match-service Docker image
	@docker push $(DOCKER_REGISTRY)/match-service:$(IMAGE_TAG)

docker-push-ai: ## Push ai-service Docker image
	@docker push $(DOCKER_REGISTRY)/ai-service:$(IMAGE_TAG)

docker-push-notification: ## Push notification-service Docker image
	@docker push $(DOCKER_REGISTRY)/notification-service:$(IMAGE_TAG)

##@ Database

migrate-up: ## Run all database migrations
	@echo "${GREEN}Running database migrations...${NC}"
	@echo "${BLUE}Running user-service migrations...${NC}"
	@cd $(SERVICES_DIR)/user-service && go run cmd/migrate/main.go up 2>/dev/null || \
		migrate -path migrations -database "$$DATABASE_URL" up 2>/dev/null || true
	@echo "${BLUE}Running resume-service migrations (Alembic)...${NC}"
	@cd $(SERVICES_DIR)/resume-service && alembic upgrade head 2>/dev/null || true
	@echo "${BLUE}Running job-service migrations (Flyway)...${NC}"
	@cd $(SERVICES_DIR)/job-service && ./gradlew flywayMigrate 2>/dev/null || true
	@echo "${BLUE}Running apply-service migrations...${NC}"
	@cd $(SERVICES_DIR)/apply-service && go run cmd/migrate/main.go up 2>/dev/null || \
		migrate -path migrations -database "$$DATABASE_URL" up 2>/dev/null || true
	@echo "${BLUE}Running notification-service migrations...${NC}"
	@cd $(SERVICES_DIR)/notification-service && go run cmd/migrate/main.go up 2>/dev/null || \
		migrate -path migrations -database "$$DATABASE_URL" up 2>/dev/null || true
	@echo "${GREEN}All migrations completed!${NC}"

migrate-down: ## Rollback database migrations
	@echo "${YELLOW}Rolling back database migrations...${NC}"
	@echo "${BLUE}Rolling back user-service migrations...${NC}"
	@cd $(SERVICES_DIR)/user-service && go run cmd/migrate/main.go down 2>/dev/null || \
		migrate -path migrations -database "$$DATABASE_URL" down 1 2>/dev/null || true
	@echo "${BLUE}Rolling back resume-service migrations (Alembic)...${NC}"
	@cd $(SERVICES_DIR)/resume-service && alembic downgrade -1 2>/dev/null || true
	@echo "${BLUE}Rolling back job-service migrations (Flyway)...${NC}"
	@cd $(SERVICES_DIR)/job-service && ./gradlew flywayUndo 2>/dev/null || true
	@echo "${BLUE}Rolling back apply-service migrations...${NC}"
	@cd $(SERVICES_DIR)/apply-service && go run cmd/migrate/main.go down 2>/dev/null || \
		migrate -path migrations -database "$$DATABASE_URL" down 1 2>/dev/null || true
	@echo "${BLUE}Rolling back notification-service migrations...${NC}"
	@cd $(SERVICES_DIR)/notification-service && go run cmd/migrate/main.go down 2>/dev/null || \
		migrate -path migrations -database "$$DATABASE_URL" down 1 2>/dev/null || true
	@echo "${GREEN}Migrations rolled back!${NC}"

migrate-create: ## Create a new migration (usage: make migrate-create SERVICE=user-service NAME=add_users_table)
	@if [ -z "$(SERVICE)" ] || [ -z "$(NAME)" ]; then \
		echo "${RED}Usage: make migrate-create SERVICE=<service-name> NAME=<migration-name>${NC}"; \
		exit 1; \
	fi
	@echo "${GREEN}Creating migration $(NAME) for $(SERVICE)...${NC}"
	@if echo "$(GO_SERVICES)" | grep -q "$(shell echo $(SERVICE) | sed 's/-service//')"; then \
		migrate create -ext sql -dir $(SERVICES_DIR)/$(SERVICE)/migrations -seq $(NAME); \
	elif echo "$(PYTHON_SERVICES)" | grep -q "$(shell echo $(SERVICE) | sed 's/-service//')"; then \
		cd $(SERVICES_DIR)/$(SERVICE) && alembic revision --autogenerate -m "$(NAME)"; \
	else \
		echo "${YELLOW}Migration creation not supported for $(SERVICE)${NC}"; \
	fi

##@ Linting & Formatting

lint: lint-go lint-python lint-java ## Run all linters
	@echo "${GREEN}All linting completed!${NC}"

lint-go: ## Lint Go services
	@echo "${BLUE}Linting Go services...${NC}"
	@for svc in $(GO_SERVICES); do \
		echo "${BLUE}Linting $$svc-service...${NC}"; \
		cd $(SERVICES_DIR)/$$svc-service && golangci-lint run ./... 2>/dev/null || go vet ./... || true; \
		cd - > /dev/null; \
	done

lint-python: ## Lint Python services
	@echo "${BLUE}Linting Python services...${NC}"
	@for svc in $(PYTHON_SERVICES); do \
		echo "${BLUE}Linting $$svc-service...${NC}"; \
		cd $(SERVICES_DIR)/$$svc-service && \
			(ruff check . 2>/dev/null || flake8 . 2>/dev/null || pylint app/ 2>/dev/null || true); \
		cd - > /dev/null; \
	done

lint-java: ## Lint Java services
	@echo "${BLUE}Linting Java services...${NC}"
	@cd $(SERVICES_DIR)/job-service && \
		(./gradlew checkstyleMain 2>/dev/null || ./mvnw checkstyle:check 2>/dev/null || true)

fmt: fmt-go fmt-python ## Format all code
	@echo "${GREEN}All formatting completed!${NC}"

fmt-go: ## Format Go code
	@echo "${BLUE}Formatting Go code...${NC}"
	@for svc in $(GO_SERVICES); do \
		echo "${BLUE}Formatting $$svc-service...${NC}"; \
		cd $(SERVICES_DIR)/$$svc-service && gofmt -w . && go mod tidy; \
		cd - > /dev/null; \
	done

fmt-python: ## Format Python code
	@echo "${BLUE}Formatting Python code...${NC}"
	@for svc in $(PYTHON_SERVICES); do \
		echo "${BLUE}Formatting $$svc-service...${NC}"; \
		cd $(SERVICES_DIR)/$$svc-service && \
			(ruff format . 2>/dev/null || black . 2>/dev/null || true); \
		cd - > /dev/null; \
	done

##@ Utilities

clean: ## Clean build artifacts
	@echo "${YELLOW}Cleaning build artifacts...${NC}"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "bin" -path "*/services/*" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".gradle" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.class" -delete 2>/dev/null || true
	@echo "${GREEN}Clean complete!${NC}"

logs: ## Show logs for all services
	@echo "${BLUE}Fetching logs...${NC}"
	@kubectl logs -l app.kubernetes.io/part-of=hirehub --all-containers=true -f

status: ## Show status of all services
	@echo "${BLUE}Service Status:${NC}"
	@kubectl get pods -l app.kubernetes.io/part-of=hirehub 2>/dev/null || echo "No pods found or cluster not running"

deps: ## Install development dependencies
	@echo "${GREEN}Installing dependencies...${NC}"
	@echo "${BLUE}Go dependencies...${NC}"
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@echo "${BLUE}Python dependencies...${NC}"
	@pip install grpcio-tools pytest uvicorn fastapi 2>/dev/null || true
	@echo "${GREEN}Dependencies installed!${NC}"

# Default target
.DEFAULT_GOAL := help
