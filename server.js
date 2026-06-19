const express = require("express");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// =======================
// AGENT WEBHOOK URLS
// =======================

// Marketing Automation Agent
const MARKETING_AGENT =
"https://presales.businessbywire.com/ambientflowgb8/flowaction/webhook/62122431-711b-4edd-8629-be45aefda75f/47feec02-a4c8-4f0f-8e46-abb4465fd7fd";


// RM Assist Agent
const RM_AGENT =
"https://presales.businessbywire.com/ambientflowmeadg/flowaction/webhook/4dd0b4cb-0539-479a-825f-ef033e7075aa/89ce6440-7f66-4643-b652-45af456977a1";



// =======================
// USER SESSION STORAGE
// =======================

let sessions = {};



// Health Check

app.get("/", (req,res)=>{

    res.send(
        "SAGE AI Multi Agent Running 🚀"
    );

});



// =======================
// SPLIT LONG WHATSAPP MSG
// =======================

function splitMessage(text, size = 1400){

    let messages = [];


    for(
        let i = 0;
        i < text.length;
        i += size
    ){

        messages.push(
            text.substring(i, i + size)
        );

    }


    return messages;

}





// =======================
// WHATSAPP WEBHOOK
// =======================


app.post("/whatsapp", async(req,res)=>{


const twiml =
new MessagingResponse();



try{


    const userPhone =
    req.body.From;


    const msg =
    req.body.Body.trim();



    console.log(
        "USER:",
        userPhone,
        msg
    );



    // =======================
    // AGENT SELECTION
    // =======================


    if(msg === "1"){


        sessions[userPhone] =
        MARKETING_AGENT;


        twiml.message(
            "✅ Marketing Automation Agent Activated"
        );


        return res
        .type("text/xml")
        .send(
            twiml.toString()
        );

    }



    if(msg === "2"){


        sessions[userPhone] =
        RM_AGENT;


        twiml.message(
            "✅ RM Assist Agent Activated"
        );


        return res
        .type("text/xml")
        .send(
            twiml.toString()
        );

    }



    // =======================
    // SHOW MENU
    // =======================


    if(
        msg.toLowerCase() === "change agent"
        ||
        !sessions[userPhone]
    ){


        delete sessions[userPhone];


        twiml.message(
`🤖 Welcome to SAGE AI

Select your AI Agent

1️⃣ Marketing Automation Agent

2️⃣ RM Assist Agent


Reply with 1 or 2`
        );



        return res
        .type("text/xml")
        .send(
            twiml.toString()
        );

    }





    // =======================
    // CALL SELECTED AGENT
    // =======================


    const selectedAgent =
    sessions[userPhone];



    const payload = {


        chatInput:[

            {
                type:"text",
                text:msg
            }

        ]


    };



    console.log(
        "Sending Payload:",
        payload
    );



    const agentResponse =
    await axios.post(

        selectedAgent,

        payload,

        {
            headers:{
                "Content-Type":"application/json"
            }
        }

    );




    console.log(
        "Agent Response:",
        agentResponse.data
    );





    let reply = "";



    // Extract response text

    if(agentResponse.data.text){


        reply =
        agentResponse.data.text;


    }

    else if(agentResponse.data.response){


        reply =
        agentResponse.data.response;


    }

    else if(agentResponse.data.output){


        reply =
        agentResponse.data.output;


    }

    else{


        reply =
        JSON.stringify(
            agentResponse.data
        );


    }




    // Send long responses

    const parts =
    splitMessage(reply);



    parts.forEach(

        part => {

            twiml.message(part);

        }

    );



    return res
    .type("text/xml")
    .send(
        twiml.toString()
    );



}

catch(error){



    console.log(
        "ERROR:",
        error.message
    );



    twiml.message(

        "⚠️ SAGE AI Agent unavailable. Please try again."

    );



    return res
    .type("text/xml")
    .send(
        twiml.toString()
    );

}


});





// =======================
// RENDER PORT
// =======================


const PORT =
process.env.PORT || 3000;



app.listen(PORT,()=>{


    console.log(
        "SAGE AI Running on Port " + PORT
    );


});
