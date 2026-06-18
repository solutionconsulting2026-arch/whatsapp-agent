const express = require("express");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// BusinessNext Agent Webhook URL
const AGENT_URL =
"https://presales.businessbywire.com/ambientflowgb8/flowaction/webhook/62122431-711b-4edd-8629-be45aefda75f/47feec02-a4c8-4f0f-8e46-abb4465fd7fd";



// Health Check
app.get("/", (req, res) => {

    res.send("WhatsApp Agent Middleware Running 🚀");

});



// Twilio WhatsApp Webhook
app.post("/whatsapp", async (req, res) => {


    try {


        console.log("Incoming WhatsApp Request:");
        console.log(req.body);


        // WhatsApp User Message
        const userMessage = req.body.Body;


        console.log("User Message:", userMessage);



        // Convert Twilio Payload -> Agent Payload
        const agentPayload = {

            chatInput: [
                {
                    type: "text",
                    text: userMessage
                }
            ]

        };


        console.log("Payload Sent To Agent:");
        console.log(agentPayload);



        // Call BusinessNext Agent
        const agentResponse = await axios.post(
            AGENT_URL,
            agentPayload,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );



        console.log("Agent Raw Response:");
        console.log(agentResponse.data);



        let reply = "";



        // Extract only message text

        if (
            agentResponse.data &&
            agentResponse.data.text
        ) {

            reply = agentResponse.data.text;

        }

        else if (
            agentResponse.data &&
            agentResponse.data.response
        ) {

            reply = agentResponse.data.response;

        }

        else if (
            agentResponse.data &&
            agentResponse.data.output
        ) {

            reply = agentResponse.data.output;

        }

        else if (
            typeof agentResponse.data === "string"
        ) {

            reply = agentResponse.data;

        }

        else {

            reply = "No response received from agent.";

        }



        console.log("Reply Sent To WhatsApp:");
        console.log(reply);



        // Send response back to WhatsApp
        const twiml = new MessagingResponse();

        twiml.message(reply);


        res.type("text/xml")
           .send(twiml.toString());



    } catch (error) {


        console.error(
            "Error:",
            error.message
        );


        const twiml = new MessagingResponse();


        twiml.message(
            "Sorry, I am unable to process your request right now."
        );


        res.type("text/xml")
           .send(twiml.toString());


    }


});




// Render / Cloud Port
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `WhatsApp Agent Running on Port ${PORT}`
    );

});
