exports.handler = async (event: any) => {
    const { customerId } = event.pathParameters;
    const taxAdvisory = event.requestContext.authorizer.claims['custom:taxAdvisory'];

    const params = {
        TableName: process.env.CUSTOMER_TABLE_NAME!,
        Key: { taxAdvisory, customerId },
    };

    const data = await dynamo.get(params).promise();

    if (!data.Item) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Customer not found' }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(data.Item),
    };
};
