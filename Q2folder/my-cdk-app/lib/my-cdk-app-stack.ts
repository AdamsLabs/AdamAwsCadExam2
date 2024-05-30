import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC with CIDR 10.30.0.0/16
    const vpc = new ec2.Vpc(this, 'MyVPC', {
      cidr: '10.30.0.0/16',
      maxAzs: 2, // Default is all AZs in the region
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'public-subnet',
        subnetType: ec2.SubnetType.PUBLIC,
      }],
    });

    // Create a Security Group for the EC2 instance
    const securityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'ec2-sg',
    });

    // Allow SSH (port 22) access from anywhere
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from anywhere');

    // Create an EC2 instance in the VPC using Public Subnet
    const instance = new ec2.Instance(this, 'MyInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Create an SQS Queue
    const queue = new sqs.Queue(this, 'MyQueue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    // Create an SNS Topic
    const topic = new sns.Topic(this, 'MyTopic');

    // Create a Secrets Manager secret with name "metrodb-secrets"
    const secret = new secretsmanager.Secret(this, 'MetroDBSecrets', {
      secretName: 'metrodb-secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });
  }
}
