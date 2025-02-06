import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class VKontrolDataBase extends Construct {
    public readonly invoiceTable: dynamodb.Table;
    public readonly customerTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.invoiceTable = new dynamodb.Table(this, 'InvoiceTable', {
            tableName: 'InvoiceTable',
            partitionKey: { 
                name: 'PK', //taxAdvisoryId 
                type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', //customerId
                 type: dynamodb.AttributeType.STRING }, 
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, 
            removalPolicy: cdk.RemovalPolicy.RETAIN, 
        });

        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'statusIndex',
            partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceDate', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL, 
        });

        new cdk.CfnOutput(this, 'InvoiceTableName', { value: this.invoiceTable.tableName });

        this.customerTable = new dynamodb.Table(this, 'CustomersTable', {
            tableName: 'CustomersTable',
            partitionKey: { name: 'taxAdvisory', type: dynamodb.AttributeType.STRING }, 
            sortKey: { name: 'customerId', type: dynamodb.AttributeType.STRING }, 
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        this.customerTable.addGlobalSecondaryIndex({
            indexName: 'emailIndex',
            partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        new cdk.CfnOutput(this, 'CustomerTableName', { value: this.customerTable.tableName });
    
    }
}
