const express = require("express");
const axios = require("axios");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();

app.use(express.urlencoded({ extended:true }));
app.use(express.json());


// Agent URLs

const MARKETING_AGENT =
"https://presales.businessbywire.com/ambientflowgb8/flowaction/webhook/62122431-711b-4edd-8629-be45aefda75f/47feec02-a4c8-4f0f-8e46-abb4465fd7fd";


const RM_AGENT =
"https://presales.businessbywire.com/ambientflowmeadg/flowaction/webhook/4dd0b4cb-0539-479a-825f-ef033e7075aa/89ce6440-7f66-4643-b652-45af456977a1";


// Store user selected agent
// Mobile -> Agent
let sessions = {};



app.get("/",(req,res)=>{
    res.send("Multi Agent WhatsApp Router Running 🚀");
});



// Split long replies
function splitMessage(text,size=1400){

    let result=[];

    for(
        let i=0;
        i<text.length;
        i+=size
    ){

        result.push(
            text.substring(i,i+size)
        );

    }

    return result;
}





app.post("/whatsapp",async(req,res)=>{


const twiml = new MessagingResponse();


try{


    const userPhone = req.body.From;

    const msg = req.body.Body.trim();


    console.log(userPhone,msg);



    // Reset agent
    if(
        msg.toLowerCase()=="change agent" ||
        !sessions[userPhone]
    ){

        delete sessions[userPhone];


        twiml.message(
`🤖 Select your AI Agent

1️⃣ Marketing Automation Agent

2️⃣ RM Assist Agent


Reply with 1 or 2`
        );


        return res
        .type("text/xml")
        .send(twiml.toString());

    }



    // Agent Selection

    if(msg=="1"){

        sessions[userPhone]=MARKETING_AGENT;


        twiml.message(
            "✅ Marketing Automation Agent activated"
        );


        return res
        .type("text/xml")
        .send(twiml.toString());

    }



    if(msg=="2"){

        sessions[userPhone]=RM_AGENT;


        twiml.message(
            "✅ RM Assist Agent activated"
        );


        return res
        .type("text/xml")
        .send(twiml.toString());

    }




    const agentURL =
    sessions[userPhone];



    const payload = {

        chatInput:[
            {
                type:"text",
                text:msg
            }
        ]

    };



    const response =
    await axios.post(
        agentURL,
        payload,
        {
            headers:{
                "Content-Type":"application/json"
            }
        }
    );



    let reply="";


    if(response.data.text){

        reply=response.data.text;

    }
    else if(response.data.response){

        reply=response.data.response;

    }
    else if(response.data.output){

        reply=response.data.output;

    }
    else{

        reply=JSON.stringify(response.data);

    }



    splitMessage(reply)
    .forEach(part=>{

        twiml.message(part);

    });



    res.type("text/xml")
    .send(
        twiml.toString()
    );



}
catch(e){


    console.log(e);


    twiml.message(
        "Agent error. Please try again."
    );


    res.type("text/xml")
    .send(
        twiml.toString()
    );


}


});





const PORT =
process.env.PORT || 3000;


app.listen(PORT,()=>{

console.log(
"Multi Agent WhatsApp running "+PORT
);

});
