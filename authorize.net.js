const { APIContracts, APIControllers, Constants } = require("authorizenet");
const createTransactionv2 = async (amount, useSavedCard, paymentNonce, customerProfileId, customerPaymentProfileId, customerData, orderDescription, token) => {
    console.log("amount,useSavedCard,paymentNonce,customerProfileId,customerPaymentProfileId,customerData,orderDescription,token",amount,useSavedCard,paymentNonce,customerProfileId,customerPaymentProfileId,customerData,orderDescription,token);
    
    const apiLoginId =
        process.env.NODE_ENV === "development"
            ? process.env.AUTHORIZE_NET_API_LOGIN_ID_SANDBOX
            : process.env.AUTHORIZE_NET_API_LOGIN_ID_PRODUCTION;

    const transactionKey =
        process.env.NODE_ENV === "development"
            ? process.env.AUTHORIZE_NET_TRANSACTION_KEY_SANDBOX
            : process.env.AUTHORIZE_NET_TRANSACTION_KEY_PRODUCTION;
    const orderInvoiceNumber = `INS${token.slice(-17).toUpperCase()}`;
    console.log("NODE_ENV",process.env.NODE_ENV);
    

    console.log("Initializing Merchant Authentication");
    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(apiLoginId);
    merchantAuthenticationType.setTransactionKey(transactionKey);
    console.log("merchantAuthenticationType",merchantAuthenticationType);
    

    console.log("Creating Order Details");
    const orderDetails = new APIContracts.OrderType();
    orderDetails.setDescription(orderDescription);
    orderDetails.setInvoiceNumber(orderInvoiceNumber);
    
    console.log("Creating Customer Data");
    const customerDataType = new APIContracts.CustomerDataType();
    customerDataType.setEmail(customerData.email);

    console.log("Creating Billing Address");
    const billingAddress = new APIContracts.CustomerAddressType();
    billingAddress.setFirstName(customerData.firstName);
    billingAddress.setLastName(customerData.lastName);

    const transactionRequestType = new APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType("authCaptureTransaction"); // Can be "authCaptureTransaction" or "authOnlyTransaction"
    transactionRequestType.setAmount(amount);
    transactionRequestType.setOrder(orderDetails);
    transactionRequestType.setCustomer(customerDataType);
    transactionRequestType.setBillTo(billingAddress);

    if (useSavedCard) {
        console.log("Using Saved Card for Transaction");
        const profilePaymentType = new APIContracts.CustomerProfilePaymentType();
        profilePaymentType.setCustomerProfileId(customerProfileId);
        profilePaymentType.setPaymentProfile(new APIContracts.PaymentProfile({ paymentProfileId: customerPaymentProfileId }));

        transactionRequestType.setProfile(profilePaymentType);
    } else {
        console.log("Using Payment Nonce for Transaction");
        const opaqueData = new APIContracts.OpaqueDataType();
        opaqueData.setDataDescriptor("COMMON.ACCEPT.INAPP.PAYMENT");
        opaqueData.setDataValue(paymentNonce);

        const paymentType = new APIContracts.PaymentType();
        paymentType.setOpaqueData(opaqueData);

        transactionRequestType.setPayment(paymentType);
    }

    console.log("Creating Transaction Request");
    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    console.log("Request Created");

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
    
    

    // Setting the environment endpoint based on NODE_ENV
    if (process.env.NODE_ENV === "development") {

        ctrl.setEnvironment(Constants.endpoint.sandbox);
    } else {
        ctrl.setEnvironment(Constants.endpoint.production);
    }
    console.log("ctrls",ctrl);
    console.log("Executing Transaction");
    return new Promise((resolve, reject) => {
        ctrl.execute(() => {
            const apiResponse = ctrl.getResponse();
            console.log("apiResponse",apiResponse)

            const response = new APIContracts.CreateTransactionResponse(apiResponse);

            console.log("Transaction has been executed");
            console.log("response of authorized net",response);
            console.log("API Response Status:", response.getMessages().getResultCode());
            

            if (response != null && response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
                const transactionResponse = response.getTransactionResponse();
                resolve(transactionResponse);
            } else {
                if (response != null) {
                    console.error("Transaction Failed:", response.getMessages().getMessage());
                    reject(new Error(response.getMessages().getMessage()[0].getText()));
                } else {
                    console.error("Null Response.");
                    reject(new Error("Null Response."));
                }
            }
        });
    });
};

// const createCustomerProfile = async () => {
//     const merchantAuth = new APIContracts.MerchantAuthenticationType();
//     merchantAuth.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID_SANDBOX);
//     merchantAuth.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY_SANDBOX);

//     const paymentType = new APIContracts.PaymentType();
//     const creditCard = new APIContracts.CreditCardType();
//     creditCard.setCardNumber("4111111111111111"); // Test card number
//     creditCard.setExpirationDate("2026-12"); // MM-YYYY
//     paymentType.setCreditCard(creditCard);

//     const paymentProfile = new APIContracts.CustomerPaymentProfileType();
//     paymentProfile.setPayment(paymentType);
//     paymentProfile.setDefaultPaymentProfile(true);

//     const customerProfile = new APIContracts.CustomerProfileType();
//     customerProfile.setMerchantCustomerId("12345"); // Custom ID for your reference
//     customerProfile.setDescription("Test Customer");
//     customerProfile.setEmail("customer45@example.com");
//     customerProfile.setPaymentProfiles([paymentProfile]);

//     const createRequest = new APIContracts.CreateCustomerProfileRequest();
//     createRequest.setMerchantAuthentication(merchantAuth);
//     createRequest.setProfile(customerProfile);

//     const controller = new APIControllers.CreateCustomerProfileController(createRequest);
//     controller.execute(() => {
//         const response = controller.getResponse();
//         const customerProfileId = response.getCustomerProfileId();
//         console.log("Customer Profile ID:", customerProfileId);
//     });
// };

// createCustomerProfile();
// const getCustomerProfile = async (customerProfileId) => {
//     const merchantAuth = new APIContracts.MerchantAuthenticationType();
//     merchantAuth.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID_SANDBOX);
//     merchantAuth.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY_SANDBOX);

//     const getRequest = new APIContracts.GetCustomerProfileRequest();
//     getRequest.setMerchantAuthentication(merchantAuth);
//     getRequest.setCustomerProfileId(customerProfileId);

//     const controller = new APIControllers.GetCustomerProfileController(getRequest);
//     controller.execute(() => {
//         const response = controller.getResponse();
//         console.log("Customer Payment Profiles:", response.getProfile().getPaymentProfiles());
//     });
// };

// getCustomerProfile("123456789"); 


module.exports = { createTransactionv2 };