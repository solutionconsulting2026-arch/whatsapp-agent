const express = require("express");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// BusinessNext Agent Webhook
const AGENT_URL =
"https://presales.businessbywire.com/ambientflowgb8/flowaction/webhook/62122431-711b-4edd-8629-be45aefda75f/47feec02-a4c8-4f0f-8e46-abb4465fd7fd";



// Health Check
app.get("/", (req,res)=>{
    res.send("WhatsApp Agent Middleware Running 🚀");
});



// WhatsApp Webhook
app.post("/whatsapp", async (req,res)=>{

    try {

        console.log("Incoming WhatsApp Payload:");
        console.log(req.body);


        // Message from Twilio
        const userMessage = req.body.Body;


        console.log("User Message:", userMessage);



        // Convert Twilio format to Agent format
        const agentPayload = {

            chatInput:[
                {
                    type:"text",
                    text:userMessage
                }
            ]

        };


        console.log("Sending to Agent:");
        console.log(agentPayload);



        // Call BusinessNext Agent
        const agentResponse = await axios.post(
            AGENT_URL,
            agentPayload,
            {
                headers:{
                    "Content-Type":"application/json"
                }
            }
        );


        console.log("Agent Response:");
        console.log(agentResponse.data);



        let reply;


        // Handling different response formats
        if(typeof agentResponse.data === "string"){

            reply = agentResponse.data;

        }
        else if(agentResponse.data.output){

            reply = agentResponse.data.output;

        }
        else if(agentResponse.data.response){

            reply = agentResponse.data.response;

        }
        else {

            reply = JSON.stringify(agentResponse.data);

        }



        // Send back to WhatsApp
        const twiml = new MessagingResponse();

        twiml.message(reply);


        res.type("text/xml");
        res.send(twiml.toString());


    }
    catch(error){

        console.error(
            "ERROR:",
            error.message
        );


        const twiml = new MessagingResponse();

        twiml.message(
            "Sorry, agent is unavailable right now."
        );


        res.type("text/xml")
           .send(twiml.toString());

    }

});



// Render Dynamic Port
const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{

    console.log(
        `WhatsApp Agent Running on port ${PORT}`
    );

});