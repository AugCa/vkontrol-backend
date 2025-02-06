import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from "path";


export class InvoiceApi extends Construct {
    public readonly api: apigateway.RestApi;

    constructor(scope: Construct, id: string, props: { authorizer: apigateway.CognitoUserPoolsAuthorizer, invoiceTable: dynamodb.Table, s3Bucket: s3.Bucket }) {
        super(scope, id);

        const { authorizer, invoiceTable, s3Bucket } = props;

        const getInvoicesLambda = new  cdk.aws_lambda_nodejs.NodejsFunction(this, 'GetInvoicesLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.ARM_64,
            handler: 'getInvoices.lambda.handler',
            entry: path.join(__dirname, 'get-invoices.lambda.ts'),
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                INVOICE_TABLE_NAME: invoiceTable.tableName,
                S3_BUCKET_NAME: s3Bucket.bucketName,
            },
        });

        const updateInvoiceLambda = new  cdk.aws_lambda_nodejs.NodejsFunction(this, 'UpdateInvoiceLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.ARM_64,
            handler: 'updateInvoice.lambda.handler',
            entry: path.join(__dirname,'update-invoices.lambda.ts'),
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                INVOICE_TABLE_NAME: invoiceTable.tableName,
            },
        });

        invoiceTable.grantReadData(getInvoicesLambda);
        invoiceTable.grantReadWriteData(updateInvoiceLambda);
        s3Bucket.grantReadWrite(getInvoicesLambda);

        this.api = new apigateway.RestApi(this, 'InvoicesApi', {
            restApiName: 'Invoices API',
            description: 'API for managing invoices (query & update)',
        });

        const invoicesResource = this.api.root.addResource('customer').addResource('invoices');

        invoicesResource.addMethod('POST', new apigateway.LambdaIntegration(getInvoicesLambda), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });

        const singleInvoiceResource = invoicesResource.addResource('{invoiceId}');
        singleInvoiceResource.addMethod('PUT', new apigateway.LambdaIntegration(updateInvoiceLambda), {
            authorizer,
            authorizationType:apigateway.AuthorizationType.COGNITO,
        });

        new cdk.CfnOutput(this, 'InvoicesApiEndpoint', { value: this.api.url });
    }
}
