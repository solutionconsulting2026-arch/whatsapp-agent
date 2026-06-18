const express = require("express");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const AGENT_URL =
"https://presales.businessbywire.com/ambientflowgb8/flowaction/webhook/62122431-711b-4edd-8629-be45aefda75f/47feec02-a4c8-4f0f-8e46-abb4465fd7fd";


// Test URL
app.get("/", (req,res)=>{
    res.send("WhatsApp Agent Middleware Running 🚀");
});


// Split large WhatsApp messages
function splitMessage(text, size = 1400){

    const chunks = [];

    for(let i = 0; i < text.length; i += size){

        chunks.push(
            text.substring(i, i + size)
        );

    }

    return chunks;
}



app.post("/whatsapp", async(req,res)=>{


try{


    const userMessage = req.body.Body;


    console.log(
        "User:",
        userMessage
    );


    const payload = {

        chatInput:[
            {
                type:"text",
                text:userMessage
            }
        ]

    };


    const agentResponse = await axios.post(
        AGENT_URL,
        payload,
        {
            headers:{
                "Content-Type":"application/json"
            }
        }
    );


    console.log(
        "Agent:",
        agentResponse.data
    );



    let reply = "";


    if(agentResponse.data.text){

        reply = agentResponse.data.text;

    }
    else if(agentResponse.data.response){

        reply = agentResponse.data.response;

    }
    else if(agentResponse.data.output){

        reply = agentResponse.data.output;

    }
    else{

        reply = JSON.stringify(agentResponse.data);

    }



    const twiml = new MessagingResponse();


    const parts = splitMessage(reply);


    parts.forEach((part)=>{

        twiml.message(part);

    });


    res.type("text/xml")
       .send(twiml.toString());



}
catch(err){


    console.log(err);


    const twiml = new MessagingResponse();


    twiml.message(
        "Unable to get agent response."
    );


    res.type("text/xml")
       .send(twiml.toString());


}


});



const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{

    console.log(
        "WhatsApp Agent Running on " + PORT
    );

});
