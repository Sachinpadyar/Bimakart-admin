import { apiSlice } from './apiSlice';

const SALESFORCE_AUTH_URL = 'https://login.salesforce.com/services/oauth2/token';
const CLIENT_ID = '3MVG9D6vJTURvMysFanYic9I6qZWMDGCihyRbQsN609pfQsjgUc90J7uijkKTuTLy7_KDBBTtAvgWta7x0hS9';
const CLIENT_SECRET = '28CA0D82421611EF16C584EA1692AE069F96D043446ADBFBB90E4A7F4D43DBB6';
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
