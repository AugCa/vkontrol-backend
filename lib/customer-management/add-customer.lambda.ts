import * as AWS from 'aws-sdk';
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const taxAdvisory = event.requestContext.authorizer.claims['custom:taxAdvisory'];
    
    const { customerId, name, email, phone, address, taxId } = JSON.parse(event.body);

    const params = {
        TableName: TABLE_NAME,
        Item: {
            taxAdvisory,
            customerId,
            name,
            email,
            phone,
            address,
            taxId,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamo.put(params).promise();

    return {
        statusCode: 201,
        body: JSON.stringify({ message: 'Customer added successfully' }),
    };
};
