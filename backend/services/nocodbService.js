const axios = require('axios');

const nocodbApiUrl = process.env.NOCODB_API_URL;
const nocodbApiToken = process.env.NOCODB_API_TOKEN;

const headers = {
    'xc-token': nocodbApiToken,
    'accept': 'application/json'
};

const getRecords = async (tableId, params) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${tableId}/records`;
    const response = await axios.get(url, { headers, params });
    return response.data;
};

const createRecord = async (tableId, data) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${tableId}/records`;
    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('NocoDB Create Error:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
};

const updateRecord = async (tableId, data) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${tableId}/records`;
    const response = await axios.patch(url, data, { headers });
    return response.data;
};

const deleteRecord = async (tableId, recordId) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${tableId}/records`;
    const response = await axios.delete(url, { headers, data: { Id: recordId } });
    return response.data;
};

const getRecordById = async (tableId, recordId) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${tableId}/records/${recordId}`;
    const response = await axios.get(url, { headers });
    return response.data;
};

module.exports = {
    getRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
};
