import { apiSlice } from './apiSlice';

const SALESFORCE_AUTH_URL = 'https://login.salesforce.com/services/oauth2/token';
const CLIENT_ID = '3MVG9pRzvMkjMb6nsW89vnPBAG2xhFCqW9dQowVxp6bz7YV9KtVNlHfJdF4lqkleJQc26zT5FI67TojPEnvv6';
const CLIENT_SECRET = '4F625BF5D58AB408DEF9104164DED1E7AD637AA9BE1DEC83993B14ADA5FB4CC6';
const USERNAME = 'admin@bimakart.com';
const PASSWORD = 'Bima@4321';

export const salesforceApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSalesforceToken: builder.mutation({
            query: () => {
                const url = new URL(SALESFORCE_AUTH_URL);
                url.searchParams.append('grant_type', 'password');
                url.searchParams.append('client_id', CLIENT_ID);
                url.searchParams.append('client_secret', CLIENT_SECRET);
                url.searchParams.append('username', USERNAME);
                url.searchParams.append('password', PASSWORD);

                return {
                    url: url.toString(),
                    method: 'POST',
                };
            },
        }),
        getSalesforceProducts: builder.mutation({
            query: ({ token, url }) => ({
                url: url || 'https://creditonepaymentsolutionsprivateli.my.salesforce-setup.com/services/apexrest/products',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        }),
    }),
});

export const { useGetSalesforceTokenMutation, useGetSalesforceProductsMutation } = salesforceApi;
