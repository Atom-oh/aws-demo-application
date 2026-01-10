module github.com/hirehub/notification-service

go 1.21

require (
	github.com/aws/aws-sdk-go-v2 v1.24.0
	github.com/aws/aws-sdk-go-v2/config v1.26.1
	github.com/aws/aws-sdk-go-v2/service/ses v1.19.5
	github.com/google/uuid v1.5.0
	github.com/jackc/pgx/v5 v5.5.1
	github.com/segmentio/kafka-go v0.4.47
	go.uber.org/zap v1.26.0
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)

require (
	firebase.google.com/go/v4 v4.13.0
	github.com/aws/aws-sdk-go-v2/credentials v1.16.12
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.14.10
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.2.9
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.5.9
	github.com/aws/aws-sdk-go-v2/internal/ini v1.7.2
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.10.9
	github.com/aws/aws-sdk-go-v2/service/sso v1.18.5
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.21.5
	github.com/aws/aws-sdk-go-v2/service/sts v1.26.5
	github.com/aws/smithy-go v1.19.0
	github.com/golang/protobuf v1.5.3
	github.com/jackc/pgpassfile v1.0.0
	github.com/jackc/pgservicefile v0.0.0-20231201235250-de7065d80cb9
	github.com/jackc/puddle/v2 v2.2.1
	github.com/klauspost/compress v1.17.4
	github.com/pierrec/lz4/v4 v4.1.19
	go.uber.org/multierr v1.11.0
	golang.org/x/crypto v0.17.0
	golang.org/x/net v0.19.0
	golang.org/x/sync v0.5.0
	golang.org/x/sys v0.15.0
	golang.org/x/text v0.14.0
	google.golang.org/genproto/googleapis/rpc v0.0.0-20231212172506-995d672761c0
)
