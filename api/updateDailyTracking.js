const axios = require('axios');

module.exports = async (req, res) => {
  const tagId = req.body.tagId;

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  try {
    // Query for today's page in the Notion database
    const response = await axios.post(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        filter: {
          timestamp: 'created_time',
          created_time: {
            equals: today,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': `${process.env.NOTION_VERSION}`,
        },
      }
    );

    // Check if a page was found
    if (response.data.results.length === 0) {
      res.status(404).send('No page found for today');
      return;
    }

    // Get the ID of today's page
    const pageId = response.data.results[0].id;

    // Get the properties of today's page
    const properties = response.data.results[0].properties;

    // Loop through the properties and update the checkbox that corresponds to the NFC tag ID
    for (const property in properties) {
      if (property === tagId && properties[property].checkbox === false) {
        await axios.patch(
          `https://api.notion.com/v1/pages/${pageId}`,
          {
            properties: {
              [tagId]: {
                checkbox: true,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
              'Notion-Version': `${process.env.NOTION_VERSION}`,
            },
          }
        );
        break;
      }
    }

    res.status(200).send('Habit Marked - Well done 🦾');
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .send('Error 400: Something went wrong...start debugging 🥲');
  }
};
