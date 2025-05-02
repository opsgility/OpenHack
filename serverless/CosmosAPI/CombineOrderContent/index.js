const axios = require('axios');

module.exports = async (context, req) => {
    context.log('JavaScript HTTP trigger function CombineOrderContent processed a request.');

    let orderHeaderDetailsContent;
    let orderLineItemsContent;
    let productInformationContent;

    // grab request body
    const orderHeaderDetailsCSV = req.body.orderHeaderDetailsCSVUrl;
    const orderLineItemsCSV = req.body.orderLineItemsCSVUrl;
    const productInformationCSV = req.body.productInformationCSVUrl;

    // validate request body
    if (orderHeaderDetailsCSV && orderLineItemsCSV && productInformationCSV) {
        // pull file content

        // Would like to find a cleaner way to do the following three try/catch blocks. Want to be able to return an error message
        // which specifies the name/path of the problematic file.
        try {
            orderHeaderDetailsContent = (await axios.get(orderHeaderDetailsCSV)).data;
        } catch (err) {
            return {
                status: err.response.status,
                body: 'Failed to retrieve file \'' + orderHeaderDetailsCSV + '\'. Please ensure file is accessible.'
            }
        }

        try {
            orderLineItemsContent = (await axios.get(orderLineItemsCSV)).data;
        } catch (err) {
            return {
                status: err.response.status,
                body: 'Failed to retrieve file \'' + orderLineItemsCSV + '\'. Please ensure file is accessible.'
            }
        }

        try {
            productInformationContent = (await axios.get(productInformationCSV)).data;
        } catch (err) {
            return {
                status: err.response.status,
                body: 'Failed to retrieve file \'' + productInformationCSV + '\'. Please ensure file is accessible.'
            }
        }

        // convert order line items into useable arrays of objects instead of strings
        let orderLineItemObjectArray = buildOrderLineItems(orderLineItemsContent);

        // convert product info into useable arrays of objects instead of strings
        let productInformationObjectArray = buildProductInformation(productInformationContent);

        // build combined order details for each order in the batch
        let combinedOrders = buildCombinedOrders(orderHeaderDetailsContent, orderLineItemObjectArray, productInformationObjectArray);

        return {
            status: 200,
            body: JSON.stringify(combinedOrders),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    } else {
        return {
            status: 400,
            body: "Invalid Parameters",
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
};

function buildCombinedOrders(orderHeaderDetailsContent, orderLineItemObjectArray, productInformationObjectArray) {
    let orderHeaderDetailsArray = orderHeaderDetailsContent.split("\r\n");
    let combinedOrders = [];
    for (let i = 1; i < orderHeaderDetailsArray.length; i++) {
        // add header for order
        let individualHeaderDetails = orderHeaderDetailsArray[i].split(',');
        let headers = {
            salesNumber: individualHeaderDetails[0],
            dateTime: individualHeaderDetails[1],
            locationId: individualHeaderDetails[2],
            locationName: individualHeaderDetails[3],
            locationAddress: individualHeaderDetails[4],
            locationPostcode: individualHeaderDetails[5],
            totalCost: individualHeaderDetails[6],
            totalTax: individualHeaderDetails[7]
        };
        // add details for order
        let details = [];
        let relatedOrderLineItems = orderLineItemObjectArray.filter((o) => o.salesNumber === headers.salesNumber);
        for (let relatedLineItem of relatedOrderLineItems) {
            let relatedProduct = productInformationObjectArray.find((p) => p.productId === relatedLineItem.productId);
            details.push({
                productId: relatedLineItem.productId,
                quantity: relatedLineItem.quantity,
                unitCost: relatedLineItem.unitCost,
                totalCost: relatedLineItem.totalCost,
                totalTax: relatedLineItem.totalTax,
                productName: relatedProduct.productName,
                productDescription: relatedProduct.productDescription
            });
        }
        combinedOrders.push({
            headers,
            details
        });
    }

    return combinedOrders;
}

function buildOrderLineItems(orderLineItemsContent) {
    let orderLineItemsArray = orderLineItemsContent.split("\r\n");
    let orderLineItemObjectArray = [];
    for (let i = 1; i < orderLineItemsArray.length; i++) {
        let individualLineItem = orderLineItemsArray[i].split(',');
        orderLineItemObjectArray.push({
            salesNumber: individualLineItem[0],
            productId: individualLineItem[1],
            quantity: individualLineItem[2],
            unitCost: individualLineItem[3],
            totalCost: individualLineItem[4],
            totalTax: individualLineItem[5]
        });
    }

    return orderLineItemObjectArray;
}

function buildProductInformation(productInformationContent) {
    let productInformationArray = productInformationContent.split("\r\n");
    let productInformationObjectArray = [];
    for (let i = 1; i < productInformationArray.length; i++) {
        let individualProduct = productInformationArray[i].split(',');
        productInformationObjectArray.push({
            productId: individualProduct[0],
            productName: individualProduct[1],
            productDescription: individualProduct[2]
        });
    }

    return productInformationObjectArray;
}