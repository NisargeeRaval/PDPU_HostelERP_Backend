async function formatDate(currentDate) {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 to get the correct month and padding with zero if needed
    const date = currentDate.getDate().toString().padStart(2, '0'); // Getting the date and padding with zero if needed

    return `${date}${month}${year}`;
}

module.exports = formatDate;