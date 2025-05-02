# About

**Deployed Azure Traffic Manager -** <https://serverlessohmanagementapi.trafficmanager.net/>

**Swagger UI -** <https://petstore.swagger.io/?url=https://serverlessohmanagementapi.trafficmanager.net/api/definition>

Environment variables are defined in Application Settings in the function app

Use funcpack to reduce load times -
```funcpack pack -c .``` to pack
```func run .``` to test locally inside ```.funcpack```
then deploy with Functions CLI (```func azure functionapp publish serverlessohproduct``` *inside ```.funcpack```*")
