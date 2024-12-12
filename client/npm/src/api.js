const API_URL = 'http://209.46.124.27:5000'; // Backend URL

export const getMessage = async () => {
    const response = await fetch(`${API_URL}/api`);
    const data = await response.json();
    return data;
};
