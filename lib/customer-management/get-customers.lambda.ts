exports.handler = async (event: any) => {
    const taxAdvisory = event.requestContext.authorizer.claims['custom:taxAdvisory'];

    const params = {
        TableName: process.env.CUSTOMER_TABLE_NAME!,
        KeyConditionExpression: 'taxAdvisory = :ta',
        ExpressionAttributeValues: { ':ta': taxAdvisory },
    };

    const data = await dynamo.query(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(data.Items),
    };
};
