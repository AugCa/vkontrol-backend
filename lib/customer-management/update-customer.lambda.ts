exports.handler = async (event: any) => {
    const { customerId } = event.pathParameters;
    const taxAdvisory = event.requestContext.authorizer.claims['custom:taxAdvisory'];
    const updates = JSON.parse(event.body);

    const updateExpression = Object.keys(updates)
        .map((key, i) => `#${key} = :value${i}`)
        .join(', ');

    const expressionAttributeValues = Object.fromEntries(
        Object.entries(updates).map(([key, value], i) => [`:value${i}`, value])
    );

    const params = {
        TableName: process.env.CUSTOMER_TABLE_NAME!,
        Key: { taxAdvisory, customerId },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: Object.fromEntries(
            Object.keys(updates).map((key) => [`#${key}`, key])
        ),
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
    };

    await dynamo.update(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Customer updated successfully' }),
    };
};
