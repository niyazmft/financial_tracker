const axios = require('axios');

const nocodbApiUrl = process.env.NOCODB_API_URL;
const nocodbApiToken = process.env.NOCODB_API_TOKEN;

const headers = {
    'xc-token': nocodbApiToken,
    'accept': 'application/json'
};

const getRecords = async (tableId, params) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${encodeURIComponent(tableId)}/records`;
    const response = await axios.get(url, { headers, params });
    return response.data;
};

const getAllRecords = async (tableId, params = {}) => {
    const pageSize = params.limit || 1000;

    // Initial request to get first page and total count
    const initialResponse = await module.exports.getRecords(tableId, { ...params, limit: pageSize, offset: 0 });

    let allRecords = initialResponse?.list || [];
    const MAX_RECORDS = 50000; // Safety limit to prevent OOM / rate limiting
    const totalRows = Math.min(initialResponse?.pageInfo?.totalRows || allRecords.length, MAX_RECORDS);

    if (totalRows > pageSize) {
        const promises = [];
        for (let offset = pageSize; offset < totalRows; offset += pageSize) {
            promises.push(module.exports.getRecords(tableId, { ...params, limit: pageSize, offset }));
        }

        const responses = await Promise.all(promises);
        for (const res of responses) {
            allRecords = allRecords.concat(res.list || []);
        }
    }

    return allRecords;
};

const createRecord = async (tableId, data) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${encodeURIComponent(tableId)}/records`;
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
    const url = `${nocodbApiUrl}/api/v2/tables/${encodeURIComponent(tableId)}/records`;
    const response = await axios.patch(url, data, { headers });
    return response.data;
};

const deleteRecord = async (tableId, recordId) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${encodeURIComponent(tableId)}/records`;
    const response = await axios.delete(url, { headers, data: { Id: recordId } });
    return response.data;
};

const getRecordById = async (tableId, recordId) => {
    const url = `${nocodbApiUrl}/api/v2/tables/${encodeURIComponent(tableId)}/records/${encodeURIComponent(recordId)}`;
    const response = await axios.get(url, { headers });
    return response.data;
};

module.exports = {
    getRecords,
    getAllRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
};
