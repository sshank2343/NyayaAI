const axios = require('axios');
const History = require('../models/History');

const handleSearchQuery = async(req,res)=>{
    try{
        const {text} = req.body;
        //Validation
        if(!text){
            return res.status(400).json({error:"Case description is required......"});
        }
        console.log(`📨 Sending query to Python AI: "${text}"`);
        
        // 2. The Bridge: Send the text to your Python FastAPI microservice
        // (Make sure your Python server is running on port 8000!)
        const pythonResponse = await axios.post('http://127.0.0.1:8000/api/search',{text:text});

        const aiAnswer= pythonResponse.data.response;
        const similarCases = pythonResponse.data.similar_cases || [];

        // Database: Save this interaction to MongoDB

        const newSearchHistory = new History({
            user: req.user.id,
            query:text,
            response:aiAnswer,
            similarCases
        });

        await newSearchHistory.save()
        console.log('💾 Search history saved to MongoDB');

        // Send the AI's answer to the react frontend
        res.status(200).json({response:aiAnswer, similar_cases: similarCases});
    } catch(error){
        console.error("❌ Gateway Error:", error.message);

        // Handle cases where the Python server is offline
        if(error.code === 'ECONNREFUSED'){
            return res.status(503).json({error:"Python AI Microservice is currently offline. "});
        }

        res.status(500).json({error:"An error occurred while processing your legal query."});
    }
};

const getUserHistory = async (req, res) => {
    try {
        const history = await History.find({ user: req.user.id })
            .sort({ timestamp: -1 })
            .select('query response similarCases timestamp')
            .lean();

        res.status(200).json({ history });
    } catch (error) {
        console.error('❌ History Fetch Error:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching history.' });
    }
};

const deleteHistoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await History.findOneAndDelete({
            _id: id,
            user: req.user.id
        });

        if (!deleted) {
            return res.status(404).json({ error: 'History item not found.' });
        }

        res.status(200).json({ message: 'History item deleted successfully.' });
    } catch (error) {
        console.error('❌ History Delete Error:', error.message);
        res.status(500).json({ error: 'An error occurred while deleting history item.' });
    }
};

module.exports = {handleSearchQuery, getUserHistory, deleteHistoryItem};