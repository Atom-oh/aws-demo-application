"""
DR Failover Lambda Function
Handles automatic and manual failover between EKS and ECS
"""

import json
import os
import boto3
from datetime import datetime

# Initialize clients
elbv2 = boto3.client('elbv2')
ecs = boto3.client('ecs')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
ALB_LISTENER_RULE_ARN = os.environ.get('ALB_LISTENER_RULE_ARN')
EKS_TARGET_GROUP_ARN = os.environ.get('EKS_TARGET_GROUP_ARN')
ECS_TARGET_GROUP_ARN = os.environ.get('ECS_TARGET_GROUP_ARN')
ECS_CLUSTER_NAME = os.environ.get('ECS_CLUSTER_NAME')
ECS_SERVICE_NAME = os.environ.get('ECS_SERVICE_NAME')


def handler(event, context):
    """
    Main Lambda handler

    Supported event types:
    1. SNS notification from CloudWatch alarm (automatic failover)
    2. Direct invocation with action parameter (manual failover)
    """
    print(f"Received event: {json.dumps(event)}")

    # Determine the action
    action = determine_action(event)
    print(f"Action determined: {action}")

    if action == 'failover_to_ecs':
        return failover_to_ecs()
    elif action == 'failover_to_eks':
        return failover_to_eks()
    elif action == 'status':
        return get_status()
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Unknown action: {action}'})
        }


def determine_action(event):
    """Determine the action based on the event source"""

    # Direct invocation with action
    if 'action' in event:
        return event['action']

    # API Gateway event
    if 'body' in event:
        try:
            body = json.loads(event['body'])
            if 'action' in body:
                return body['action']
        except:
            pass

    # SNS notification from CloudWatch alarm
    if 'Records' in event:
        for record in event['Records']:
            if record.get('EventSource') == 'aws:sns':
                message = json.loads(record['Sns']['Message'])
                alarm_state = message.get('NewStateValue')

                if alarm_state == 'ALARM':
                    return 'failover_to_ecs'
                elif alarm_state == 'OK':
                    return 'failover_to_eks'

    return 'status'


def failover_to_ecs():
    """Switch traffic from EKS to ECS"""
    print("Initiating failover to ECS...")

    try:
        # Scale up ECS service
        scale_ecs_service(desired_count=3)

        # Update ALB listener rule weights
        update_alb_weights(eks_weight=0, ecs_weight=100)

        # Publish metric
        publish_metric('FailoverToECS', 1)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'success',
                'action': 'failover_to_ecs',
                'message': 'Traffic switched to ECS',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    except Exception as e:
        print(f"Error during failover to ECS: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def failover_to_eks():
    """Switch traffic back to EKS"""
    print("Initiating failover back to EKS...")

    try:
        # Update ALB listener rule weights
        update_alb_weights(eks_weight=100, ecs_weight=0)

        # Scale down ECS service (keep minimum)
        scale_ecs_service(desired_count=1)

        # Publish metric
        publish_metric('FailoverToEKS', 1)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'success',
                'action': 'failover_to_eks',
                'message': 'Traffic switched to EKS',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    except Exception as e:
        print(f"Error during failover to EKS: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def update_alb_weights(eks_weight: int, ecs_weight: int):
    """Update ALB listener rule with new target group weights"""
    print(f"Updating ALB weights: EKS={eks_weight}%, ECS={ecs_weight}%")

    response = elbv2.modify_rule(
        RuleArn=ALB_LISTENER_RULE_ARN,
        Actions=[{
            'Type': 'forward',
            'ForwardConfig': {
                'TargetGroups': [
                    {
                        'TargetGroupArn': EKS_TARGET_GROUP_ARN,
                        'Weight': eks_weight
                    },
                    {
                        'TargetGroupArn': ECS_TARGET_GROUP_ARN,
                        'Weight': ecs_weight
                    }
                ],
                'TargetGroupStickinessConfig': {
                    'Enabled': False
                }
            }
        }]
    )

    print(f"ALB rule updated successfully")
    return response


def scale_ecs_service(desired_count: int):
    """Scale ECS service to specified count"""
    print(f"Scaling ECS service to {desired_count} tasks")

    response = ecs.update_service(
        cluster=ECS_CLUSTER_NAME,
        service=ECS_SERVICE_NAME,
        desiredCount=desired_count
    )

    print(f"ECS service scaled to {desired_count}")
    return response


def get_status():
    """Get current DR status"""
    try:
        # Get ALB rule status
        rules = elbv2.describe_rules(RuleArns=[ALB_LISTENER_RULE_ARN])

        current_weights = {}
        for action in rules['Rules'][0]['Actions']:
            if action['Type'] == 'forward':
                for tg in action.get('ForwardConfig', {}).get('TargetGroups', []):
                    arn = tg['TargetGroupArn']
                    weight = tg['Weight']
                    if arn == EKS_TARGET_GROUP_ARN:
                        current_weights['eks'] = weight
                    elif arn == ECS_TARGET_GROUP_ARN:
                        current_weights['ecs'] = weight

        # Get ECS service status
        services = ecs.describe_services(
            cluster=ECS_CLUSTER_NAME,
            services=[ECS_SERVICE_NAME]
        )

        ecs_status = {}
        if services['services']:
            svc = services['services'][0]
            ecs_status = {
                'running_count': svc['runningCount'],
                'desired_count': svc['desiredCount'],
                'status': svc['status']
            }

        # Determine active cluster
        if current_weights.get('eks', 0) > current_weights.get('ecs', 0):
            active_cluster = 'EKS'
        else:
            active_cluster = 'ECS'

        return {
            'statusCode': 200,
            'body': json.dumps({
                'active_cluster': active_cluster,
                'weights': current_weights,
                'ecs_service': ecs_status,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def publish_metric(metric_name: str, value: float):
    """Publish custom metric to CloudWatch"""
    cloudwatch.put_metric_data(
        Namespace='HireHub/DR',
        MetricData=[{
            'MetricName': metric_name,
            'Value': value,
            'Unit': 'Count',
            'Dimensions': [
                {
                    'Name': 'Environment',
                    'Value': os.environ.get('ENVIRONMENT', 'production')
                }
            ]
        }]
    )
