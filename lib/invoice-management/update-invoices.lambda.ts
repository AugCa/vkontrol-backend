import * as AWS from 'aws-sdk';
const dynamo = new AWS.DynamoDB.DocumentClient();
const INVOICE_TABLE_NAME = process.env.INVOICE_TABLE_NAME!;

exports.handler = async (event: any) => {
    try {
        const { invoiceId } = event.pathParameters;
        const taxAdvisory = event.requestContext.authorizer.claims['custom:taxAdvisory'];
        const updates = JSON.parse(event.body);

        const updateExpression = Object.keys(updates)
            .map((key, i) => `#${key} = :value${i}`)
            .join(', ');

        const expressionAttributeValues = Object.fromEntries(
            Object.entries(updates).map(([key, value], i) => [`:value${i}`, value])
        );

        const params = {
            TableName: INVOICE_TABLE_NAME,
            Key: { taxAdvisory, invoiceId },
            UpdateExpression: `SET ${updateExpression}`,
            ExpressionAttributeNames: Object.fromEntries(
                Object.keys(updates).map((key) => [`#${key}`, key])
            ),
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'UPDATED_NEW',
        };

        await dynamo.update(params).promise();

        return { statusCode: 200, body: JSON.stringify({ message: 'Invoice updated successfully' }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error updating invoice' }) };
    }
};
