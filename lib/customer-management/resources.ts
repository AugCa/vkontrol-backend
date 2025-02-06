import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from "path";

export class CustomerApi extends Construct {
    public readonly api: apigateway.RestApi;

    constructor(scope: Construct, id: string, props: { customerTable: dynamodb.Table, authorizer: apigateway.CognitoUserPoolsAuthorizer }) {
        super(scope, id);

        const { customerTable, authorizer } = props;

        this.api = new apigateway.RestApi(this, 'CustomerApi', {
            restApiName: 'Customer Management API',
            description: 'API for managing customers within a tax advisory firm',
        });

        const lambdaProps = {
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                CUSTOMER_TABLE_NAME: customerTable.tableName,
            },
        };

        const addCustomerLambda = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'AddCustomerLambda', {
            ...lambdaProps,
            handler: 'addCustomer.lambda.handler',
            entry: path.join(__dirname, "add-customer.lambda.ts"),
            
        });

        const getCustomersLambda = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'GetCustomersLambda', {
            ...lambdaProps,
            handler: 'getCustomers.lambda.handler',
            entry: path.join(__dirname, 'get-customers.lambda.ts'),
        });

        const getCustomerLambda = new  cdk.aws_lambda_nodejs.NodejsFunction(this, 'GetCustomerLambda', {
            ...lambdaProps,
            handler: 'getCustomer.lambda.handler',
            entry: path.join(__dirname,'get-customer.lambda.ts'),
        });

        const updateCustomerLambda = new  cdk.aws_lambda_nodejs.NodejsFunction(this, 'UpdateCustomerLambda', {
            ...lambdaProps,
            handler: 'updateCustomer.lambda.handler',
            entry: path.join(__dirname,'update-customer.lambda.ts'),
        });

        const deleteCustomerLambda = new  cdk.aws_lambda_nodejs.NodejsFunction(this, 'DeleteCustomerLambda', {
            ...lambdaProps,
            handler: 'deleteCustomer.lambda.handler',
           entry: path.join(__dirname,'delete-customer.lambda.ts'),
        });

        customerTable.grantReadWriteData(addCustomerLambda);
        customerTable.grantReadData(getCustomersLambda);
        customerTable.grantReadData(getCustomerLambda);
        customerTable.grantWriteData(updateCustomerLambda);
        customerTable.grantWriteData(deleteCustomerLambda);

        const customersResource = this.api.root.addResource('customers');

        const apiProps = {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        }

        customersResource.addMethod('POST', new apigateway.LambdaIntegration(addCustomerLambda), apiProps);

        customersResource.addMethod('GET', new apigateway.LambdaIntegration(getCustomersLambda), apiProps);

        const customerResource = customersResource.addResource('{customerId}');

        customerResource.addMethod('GET', new apigateway.LambdaIntegration(getCustomerLambda), apiProps);

        customerResource.addMethod('PUT', new apigateway.LambdaIntegration(updateCustomerLambda), apiProps);

        customerResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteCustomerLambda), apiProps);

        new cdk.CfnOutput(this, 'CustomerApiEndpoint', { value: this.api.url });
    }
}
