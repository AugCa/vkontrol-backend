import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const INVOICE_TABLE_NAME = process.env.INVOICE_TABLE_NAME!;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

exports.handler = async (event: any) => {
    try {
        const { customerId, dateFrom, dateTo } = JSON.parse(event.body);
        let queryParams: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: INVOICE_TABLE_NAME,
            KeyConditionExpression: 'taxAdvisory = :ta',
            ExpressionAttributeValues: {
                ':ta': event.requestContext.authorizer.claims['custom:taxAdvisory'],
            },
        };

        if (customerId) {
            queryParams.KeyConditionExpression += ' AND customerId = :cid';
            queryParams.ExpressionAttributeValues![':cid'] = customerId;
        }
        if (dateFrom && dateTo) {
            queryParams.KeyConditionExpression += ' AND invoiceDate BETWEEN :dateFrom AND :dateTo';
            queryParams.ExpressionAttributeValues![':dateFrom'] = dateFrom;
            queryParams.ExpressionAttributeValues![':dateTo'] = dateTo;
        }

        const results = await dynamo.query(queryParams).promise();

        const csvData = (results.Items || []);


        const fileKey = `exports/invoices_${uuidv4()}.csv`;
        await s3.putObject({ Bucket: S3_BUCKET_NAME, Key: fileKey, Body: csvData, ContentType: 'text/csv' }).promise();

        const presignedUrl = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET_NAME, Key: fileKey, Expires: 600 });

        return { statusCode: 200, body: JSON.stringify({ presignedUrl }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching invoices' }) };
    }
};
