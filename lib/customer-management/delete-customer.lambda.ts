const TABLE_NAME = process.env.CUSTOMER_TABLE_NAME!;
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const { customerId } = event.pathParameters;
    const taxAdvisory = event.requestContext.authorizer.claims['custom:taxAdvisory'];
    
    const params = {
        TableName: TABLE_NAME,
        Key: { taxAdvisory, customerId },
    };

    await dynamo.delete(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Customer deleted successfully' }),
    };
};
