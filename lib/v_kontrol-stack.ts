import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthStack } from './auth/resources';
import { VKontrolDataBase } from './databases/resources';
import { CustomerApi } from './customer-management/resources';
import { InvoiceApi } from './invoice-management/resources';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class VKontrolStack extends cdk.Stack {
  readonly cognito: AuthStack;
  readonly database: VKontrolDataBase;
  readonly customerApi: CustomerApi;
  readonly invoiceApi: InvoiceApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.cognito = new AuthStack(this, 'CognitoAuthorization', {});
    const { authorizer } = this.cognito; 

    this.database = new VKontrolDataBase(this, 'Database');
    const { customerTable, invoiceTable } = this.database;

    this.customerApi = new CustomerApi(this, 'CustomerAPI', {
      customerTable,
      authorizer,
    }); 

    this.invoiceApi = new InvoiceApi(this, 'InvoiceAPI', {
      invoiceTable, 
      authorizer,
      s3Bucket: new Bucket(this, 'invoicesBucket'),
    });


  }
}
