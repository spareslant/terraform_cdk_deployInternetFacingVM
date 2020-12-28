import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider, Instance, Vpc, KeyPair, Subnet, SecurityGroup, InternetGateway, DefaultRouteTable } from './.gen/providers/aws'
import { sshPrivateKey, sshPublicKey } from './generatSSHkeys'

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws', {
      region: 'eu-west-2',
      profile: 'personal'
    });

    const myKey = new KeyPair(this, 'myKeyPair', {
      keyName: "myKey",
      publicKey: sshPublicKey
    });

    const vpc = new Vpc(this, 'myVpc', {
      cidrBlock: '10.0.0.0/16',
    });

    const myGateway = new InternetGateway(this, 'myGateway', {
      vpcId: vpc.id
    });

    new DefaultRouteTable(this, 'add_default_route', {
      defaultRouteTableId: vpc.defaultRouteTableId,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: myGateway.id,
          egressOnlyGatewayId: '',
          instanceId: '',
          ipv6CidrBlock: '',
          natGatewayId: '',
          networkInterfaceId: '',
          transitGatewayId: '',
          vpcPeeringConnectionId: ''
        }
      ]
    });

    const publicSubnet = new Subnet(this, 'publicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      mapPublicIpOnLaunch: true
    });
    new Subnet(this, 'privateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
    });
    new Subnet(this, 'privateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
    });

    const allowIncomingSSH = new SecurityGroup(this, 'allowIncomingSSH', {
      name: "allowIncomingSSH",
      vpcId: vpc.id,
      ingress: [
        {
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          fromPort: 0,
          protocol: "-1",
          securityGroups: [],
          description: "allow ssh",
          ipv6CidrBlocks: [],
          prefixListIds: [],
          selfAttribute: false
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          protocol: "-1",
          securityGroups: [],
          description: "allow all outgoing",
          ipv6CidrBlocks: [],
          prefixListIds: [],
          selfAttribute: false
        }
      ]
    });

    const instance = new Instance(this, 'myVmInstance', {
      instanceType: 't2.micro',
      ami: 'ami-0e9ae639e4d979a9f',
      keyName: myKey.keyName,
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [
        allowIncomingSSH.id
      ]
    });

    new TerraformOutput(this, 'public_ip', {
      value: instance.publicIp
    })
    new TerraformOutput(this, 'privateKey', {
      value: sshPrivateKey
    })

  }
}

const app = new App();
new MyStack(app, 'deployInternetFacingVM');
app.synth();
