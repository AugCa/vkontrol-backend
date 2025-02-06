import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AuthStack extends cdk.NestedStack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        this.userPool = new cognito.UserPool(this, 'TaxAdvisorUserPool', {
            userPoolName: 'TaxAdvisorUserPool',
            selfSignUpEnabled: false, 
            signInAliases: { email: true }, 
            standardAttributes: {
                email: { required: true, mutable: true },
                phoneNumber: { required: false, mutable: true }
            },
            customAttributes: {
                taxAdvisory: new cognito.StringAttribute({ mutable: false }),
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY, 
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false
            },
            removalPolicy: cdk.RemovalPolicy.RETAIN 
        });

        new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
            groupName: 'admin',
            userPoolId: this.userPool.userPoolId,
            description: 'Admin users with full access',
            precedence: 1 
        });

        new cognito.CfnUserPoolGroup(this, 'AccountantGroup', {
            groupName: 'accountant',
            userPoolId: this.userPool.userPoolId,
            description: 'Accountants with limited access',
            precedence: 2 
        });

        this.userPoolClient = new cognito.UserPoolClient(this, 'WebAppClient', {
            userPool: this.userPool,
            userPoolClientName: 'WebAppClient',
            generateSecret: false, 
            authFlows: {
                userPassword: true,
                userSrp: true
            },
            preventUserExistenceErrors: true,
            oAuth: {
                callbackUrls: ['https://yourapp.com/callback'],
                logoutUrls: ['https://yourapp.com/logout'],
                scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE]
            }
        });

        this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
            cognitoUserPools: [this.userPool]
        });

        new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
        new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    }
}
