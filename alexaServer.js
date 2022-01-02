import express from "express";

import { session } from "sessionlib/session.js";

import axios from "axios"

import cors from "cors";

import { MongoClient } from "mongodb";

import Alexa from "ask-sdk-core"

import { ExpressAdapter } from 'ask-sdk-express-adapter';

export const app = express();



const uri = `mongodb://root:${process.env.MYSQL_ROOT_PASSWORD}@mongo:27017/?authSource=admin&readPreference=primary&directConnection=true&ssl=false`
const client = new MongoClient(uri);

client.connect().then(() => {
    global.database = client.db("cloud");

})

app.disable('x-powered-by');


app.use(cors());


app.get("/api/v1/alexa", (req, res) => {
    res.send(JSON.stringify({ microService: "Alexa" }))
})



app.listen(3000, () => {
    console.log(`Alexa app listening at http://localhost:3000`);
});



const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {

           return new Promise((resolve,reject)=>{
               console.log("1")
   
               checkAPIKey(handlerInput).then((result)=>{
                   if(result.valid) {
                       
   
                       getUserInfo(handlerInput).then(userInfo=>{
                           console.log("4")
   
                           resolve(handlerInput.responseBuilder
                               .speak(`Hallo ${userInfo.name}. Was möchtest du tun?`)
                               .reprompt(`Was möchtest du tun?`)
                               .withSimpleCard(`FT-Cloud Skill`, `Hallo ${userInfo.name}. Willkommen beim FT-Cloud Skill. Was möchtest du tun?`)
                               .getResponse())
   
                       })
           
   
                   }else{
   
                       resolve(handlerInput.responseBuilder
                           .speak("Willkommen beim FT-Cloud Skill. Bitte autorisiere deinen Account in der Alexa-App")
                           .reprompt("Willkommen beim FT-Cloud Skill. Bitte autorisiere deinen Account in der Alexa-App")
                           .withSimpleCard('FT-Cloud Skill', "Willkommen beim FT-Cloud Skill. Bitte autorisiere deinen Account in der Alexa-App")
                           .getResponse())
           
                   }
           
                 })
           })
           
     




    }
};

const GetUsername = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetUsername';
    },
    handle(handlerInput) {

           return new Promise((resolve,reject)=>{
   
               
   
                       getUserInfo(handlerInput).then(userInfo=>{
   
                           resolve(handlerInput.responseBuilder
                               .speak(`Du bist ${userInfo.name}`)
                               .withSimpleCard(`Du bist ${userInfo.name}`)
                               .getResponse())
   
                       })
           
   
                  
           })
           
     




    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Das habe ich nicht verstanden. Bitte wiederholen.')
            .reprompt('Das habe ich nicht verstanden. Bitte wiederholen.')
            .getResponse();
    }
};




let skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GetUsername
    )
    .addErrorHandlers(ErrorHandler)
    .create();


const adapter = new ExpressAdapter(skill, true, true);



app.post('/api/v1/alexa/request', adapter.getRequestHandlers());


function checkAPIKey(handlerInput) {
    return new Promise(resolve => {

        if (handlerInput.requestEnvelope.context.System.user.accessToken == null) {
            resolve({
                valid: false
            });
        } else {

            session.validateSession(handlerInput.requestEnvelope.context.System.user.accessToken, (result) => {

                resolve({
                    valid: result
                });

            })

        }

    })
}


function getUserInfo(handlerInput) {

  return new Promise(resolve=>{
    axios("http://account:3000/api/v1/account/info?session=" + handlerInput.requestEnvelope.context.System.user.accessToken).then(parsed => {
        console.log(parsed.data)
        resolve(parsed.data)
    })
  })


}

app.use(function (err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    console.log("here")
    console.error(err);
    res.status(500);
    res.send('Something went wrong')
})


app.use(function (req, res) {
    res.status(404).send('Something went wrong! Microservice: Alexa');
});

