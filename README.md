## Backendless-Backbone plugin
   
> This plugin is an extension for [Backbone.js](http://backbonejs.org/) framework and it's based on [Backendless JS SDK](https://backendless.com/mobile-developers/quick-start-guide-for-javascript/)
> which provide you to get an easy way to use [Backendless](https://backendless.com/) with [Backbone.js](http://backbonejs.org/).</br> 
> You can use any features and services of Backendless JS SDK, the plugin just helps you to use Backendless Data Service in your project  

## Table of contents

  - [Getting started](#getting-started)
  - [Initialize your Backendless Application](#initialize-your-backendless-application)
  - [Model usages](#model-usages)
   - [Define Backendless Model Class](#define-backendless-model-class)
   - [Create an instance of Backendless Model](#create-an-instance-of-backendless-model)
   - [Create and Save Backendless Model](#create-and-save-backendless-model)
   - [Update Backendless Model](#update-backendless-model)
   - [Destroy Backendless Model](#destroy-backendless-model)
   - [Retrieving Schema Definition](#retrieving-schema-definition)
   - [Fetch Backendless Model](#fetch-backendless-model)
   - [Find Backendless Model by Id](#find-backendless-model-by-id)
   - [Find the first Backendless Model](#find-the-first-backendless-model)
   - [Find the last Backendless Model](#find-the-last-backendless-model)
   - [Advanced Search](#advanced-search)
  - [Collection usages](#collection-usages)
   - [Define Backendless Collection Class](#define-backendless-collection-class)
   - [Create an instance of Backendless Collection](#create-an-instance-of-backendless-collection)
   - [Fetch Backendless Collection](#fetch-backendless-collection)
   - [Fetch Backendless Collection with query params](#fetch-backendless-collection-with-query-params)
  - [Relations and nested Models/Collections](#relations-and-nested-modelscollections)
   - [Nested items](#nested-items)
   - [Update nested items](#update-nested-items)
   - [Retrieve nested items](#retrieve-nested-items)
   - [Events](#events)
  

## Getting started

Add Backbone.js and Backbone's dependencies into you project. </br> 
Add Backendless JS SDK into you project. </br>
Add the plugin into you project, four quick start options are available:

- [Download the latest release](https://github.com/Backendless/Backbone-SDK/archive/master.zip).
- Clone the repository: `git clone https://github.com/Backendless/Backendless-Backbone.git`.
- Install with [NPM](http://npmjs.org): `npm install backendless-backbone`.
- Install with [Bower](http://bower.io): `bower install backendless-backbone`.

Include files:

```html
<script src="/path/to/backbone.js"></script><!-- Backbone is required -->
<script src="/path/to/backendless-js.js"></script><!-- Backendless JS SDK is required -->
<script src="/path/to/backendless-backbone.js"></script>
```

### Initialize Your Backendless Application:

```js
  var APPLICATION_ID = 'YOUR-APPLICATION-ID';
  var JS_SECRET_KEY = 'YOUR-JS_SECRET_KEY';
  var APPLICATION_VERSION = 'v1'; // it's default

  Backendless.initApp(APPLICATION_ID, JS_SECRET_KEY, APPLICATION_VERSION);

```

### Model usages

   - [Define Backendless Model Class](#define-backendless-model-class)
   - [Create an instance of Backendless Model](#create-an-instance-of-backendless-model)
   - [Create and Save Backendless Model](#create-and-save-backendless-model)
   - [Update Backendless Model](#update-backendless-model)
   - [Destroy Backendless Model](#destroy-backendless-model)
   - [Retrieving Schema Definition](#retrieving-schema-definition)
   - [Fetch Backendless Model](#fetch-backendless-model)
   - [Find Backendless Model by Id](#find-backendless-model-by-id)
   - [Find the first Backendless Model](#find-the-first-backendless-model)
   - [Find the last Backendless Model](#find-the-last-backendless-model)
   - [Advanced Search](#advanced-search)
   
#### Define Backendless Model Class:

```js
  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
 
```

#### Create an instance of Backendless Model:

```js
  var contact = new Contact({name: 'Bob', age: 32});
 
```

or
 
```js
  var contact = new Backbone.Model({name: 'Bob', age: 32}, {schemaName: 'Contact'});
 
``` 
 or 
 
```js
  var contact = new Backbone.Model({___class: 'Contact', name: 'Bob', age: 32});
 
``` 

#### Create and Save Backendless Model:

```js
  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
  var contact = new Contact({name: 'Bob', age: 32});
  
  contact.save();
  
  // after save the model:
  
  contact.toJSON() ==> {___class: 'Contact', objectId: 'CONTACT-OBJECT-ID', name: 'Bob', age: 32}
 
```
or 

```js
  var Contacts = Backbone.Collection.extend({schemaName: 'Contact'});
  var contact = Contacts.create({name: 'Bob', age: 32});
  
  // after save the model:
  
  contact.toJSON() ==> {___class: 'Contact', objectId: 'CONTACT-OBJECT-ID', name: 'Bob', age: 32}
 
```
   
#### Update Backendless Model:

```js
  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
  var contact = new Contact({objectId: 'CONTACT-OBJECT-ID'});
  
  contact.fetch().done(function(){
    
    contact.set({name: 'Nick '});
    contact.save();
    
    //or 
    
    contact.save({name: 'Nick '});
    
  });

```  

#### Destroy Backendless Model:

```js
  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
  var contact = new Contact({objectId: 'CONTACT-OBJECT-ID'});
  
  contact.destroy();

```

#### Retrieving Schema Definition

```js
  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
  var contact = new Contact();
  
  contact.describe({
      success:function(){
        console.log(contact.schema);
      }
  });

```

#### Fetch Backendless Model:

```js
  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
  var contact = new Contact({objectId: 'CONTACT-OBJECT-ID'});
  
  contact.fetch();
  
  // after fetch the model:
  
  contact.toJSON() ==> {___class: 'Contact', objectId: 'CONTACT-OBJECT-ID', name: 'Bob', age: 32}
 
```

#### Find Backendless Model by Id:

```js
  var contact = new Contact();
  
  contact.fetch({id: 'CONTACT-OBJECT-ID'});
 
```

#### Find the first Backendless Model:

```js
  var contact = new Contact();
  
  contact.fetch();
 
```

#### Find the last Backendless Model:

```js
  var contact = new Contact();
  
  contact.fetch({isLast: true});
 
```

#### Advanced Search
   Query params:
   
   - __properties__: [_Array_ | _String_] - is an array or string containing property names. If the array has any data, find operations return data object(s) with the requested property names.
   - __relations__: [_Array_ | _String_] - references object properties which are relations and should be initialized and returned with the parent object. By default relations are not returned with the parent object and require a separate API call to load. Using the loadRelations query parameter Backendless pre-initializes the specified relations and returns them with the parent object..
   - __relationsDepth__: [_Number_] - hierarchy depth of the relations to include into the response.
   - __condition__: [_String_] - this is a query in the SQL-92 syntax (the "where" clause part) to search for data with
   - __sortingBy__: [_Array_ | _String_] - is an array or string of properties by which should be sorted by, 

    
    The first three params you can use every time, but __condition__ and __sortingBy__ uses when the model has no `id` and you want to find the first/last model of founded and sorted items 
    
    Example: find the first contact `where name=Nick` `and sorted by age`   
    
    ```js
      var contact  = new Contacts();
      
      contact.fetch({
        condition: 'name=Nick',
        sortingBy: 'age desc'
      });
     
    ```

    You can define the query params as model props (value or function) or pass it to fetch as options
    
    ```js
    
    var Contact = Backbone.Model.extend({
        schemaName: 'Contact',
        
        properties:function(){
            return ['name', 'age', 'myProp'];
        },
        
        relations: ['address'],
        
        relationsDepth: 2,
        
        condition: 'age > 21'
        
        sortingBy: 'age desc, name asc'
    });
    
    var contact = new Contact();
    
    contact.fetch();
     
    ```
    or 
    
    ```js
    
    var Contact = Backbone.Model.extend({ schemaName: 'Contact' });
    var contact = new Contact();
    
    contact.fetch({
        properties:function(){
            return ['name', 'age', 'myProp'];
        },
            
        relations: ['address'],
            
        relationsDepth: 2,
            
        condition: 'age > 21'
            
        sortingBy: 'age desc, name asc'
    })
    
    ```


### Collection usages

   - [Define Backendless Collection Class](#define-backendless-collection-class)
   - [Create an instance of Backendless Collection](#create-an-instance-of-backendless-collection)
   - [Fetch Backendless Collection](#fetch-backendless-collection)
   - [Fetch Backendless Collection with query params](#fetch-backendless-collection-with-query-params)

#### Define Backendless Collection Class:

```js
  var Contacts = Backbone.Collection.extend({schemaName: 'Contact'});
 
```

or 

```js

  var Contact = Backbone.Model.extend({schemaName: 'Contact'});
  var Contacts = Backbone.Collection.extend({model: Contact});
 
```

#### Create an instance of Backendless Collection:

```js
  var contacts = new Contacts([{name: 'Bob', age: 32}]);
 
```

or
 
```js
  var contacts = new Backbone.Collection([{name: 'Bob', age: 32}], {schemaName: 'Contact'});
 
``` 
 or 
 
```js
  var contacts = new Backbone.Model([{___class: 'Contact', name: 'Bob', age: 32}]);
 
``` 

#### Fetch Backendless Collection:

```js
  var Contacts = Backbone.Collection.extend({schemaName: 'Contact'});
  var contact = new Contacts();
  
  contact.fetch();
  
  // after fetch the collection:
  
  contact.toJSON() ==> [{___class: 'Contact', objectId: 'CONTACT-OBJECT-ID', name: 'Bob', age: 32}]
```

And also Backendless return from server paged information, for Ex. after fetch you can get current page offset and total items:

```js
  var Contacts = Backbone.Collection.extend({schemaName: 'Contact'});
  var contact = new Contacts();
  
  contact.fetch();
  
  // after fetch the model:
  
  contact.offsetItems ==> 0;
  contact.totalItems ==> 123456;
      
```

#### Fetch Backendless Collection with query params:

The same params as for Models:
   - __properties__: [_Array_ | _String_] - is an array or string containing property names. If the array has any data, find operations return data object(s) with the requested property names.
   - __relations__: [_Array_ | _String_] - references object properties which are relations and should be initialized and returned with the parent object. By default relations are not returned with the parent object and require a separate API call to load. Using the loadRelations query parameter Backendless pre-initializes the specified relations and returns them with the parent object..
   - __relationsDepth__: [_Number_] - hierarchy depth of the relations to include into the response.
   - __condition__: [_String_] - this is a query in the SQL-92 syntax (the "where" clause part) to search for data with
   - __sortingBy__: [_Array_ | _String_] - is an array or string of properties by which should be sorted by, 

Paged params:
   - __pageSize__: [_Number_] - sets the size of the "page", i.e. the size of the collection of results to be returned by the find operation.
   - __offset__: [_Number_] - sets the offset in the data store from where to search for data.

The same behavior as for Models, you can define the props in CollectionClass or pass it to fetch as options
   


### Relations and nested Models/Collections

   - [Nested items](#nested-items)
   - [Update nested items](#update-nested-items)
   - [Retrieve nested items](#retrieve-nested-items)
   - [Events](#events)

A data object stored in a Backendless backend may reference other objects. These references are called relations. There are two types of relations: one-to-one and one-to-many. Relations may be declared manually in a table schema using the Backendless Console or derived (and added to schema) from the objects which are being saved. Additionally, Backendless supports bidirectional relations between the objects stored in the Data Service and other entities in a Backendless backend. For example, a data object may have a relation with a User object and/or Geo Point objects.

[Read more about relations here](https://backendless.com/documentation/data/js/data_relations.htm)

#### Nested items  

You can create a nested items in your Models easy:

```js
     var PhoneBook = Backbone.Model.extend({schemaName: 'PhoneBook'});
    
      var Contact = Backbone.Model.extend({schemaName: 'Contact'});
    
      var Contacts = Backbone.Collection.extend({model: Contact});
    
      var Address = Backbone.Model.extend({schemaName: 'Address'});
    
      var john = new Contact({
        name   : "John",
        age    : 27,
        address: new Address({city: "Denver"})
      });
    
      var mom = new Contact({
        name   : "Mom",
        age    : 45,
        address: new Address({city: "Denver"})
      });
    
      var bob = new Contact({
        name   : "Bob",
        age    : 22,
        address: new Address({city: "Denver"})
      });
    
      var nick = new Contact({
        name   : "Nick",
        age    : 25,
        address: new Address({city: "New York"})
      });
           
      var phoneBook = new PhoneBook({owner: john, contacts: new Contacts([mom, bob])});
    
````

#### Update nested items  
You can save parent model the first time and then save only data what you need for save traffic 

```js

    phoneBook.save(); // save parent and all nested items in the server
    
    phoneBook.get('owner').save({age:30}, {patch: true}); // sent to server only {age:30}
    phoneBook.get('contacts').create(nick); // save nick on the server and added into contacts collection

```

#### Retrieve nested items 
if you use `get` method for getting nested items you get Backbone.Model/Collection instance
but when you use `toJSON` it return to you a cloned object with all nested items

```js

    phoneBook.toJSON() ===> {
        ___class: 'PhoneBook',
        owner   : {
            ___class:'Contact',
            name    : "John",
            age     : 27,
            address : {
                ___class:'Address',
                city: "Denver"
            }    
        },
        contacts: [
            {
                ___class:'Contact',
                name    : "Mom",
                age     : 45,
                address : {
                    ___class:'Address',
                    city: "Denver"
                }    
            },
            ....
            {
                ___class:'Contact',
                name    : "Bob",
                age     : 22,
                address : {
                    ___class:'Address',
                    city: "Denver"
                }    
            }
        ]
    }

```

#### Events
Subscribe on events for nested items is really easy, just use `.` dot between nested items keys.<br>
You can use all Backbone events

```js
    phoneBook.on('owner.change:name', this.onOwnerNameChange, this);
    phoneBook.on('owner.address.change', this.onOwnerAddressChange, this);
    phoneBook.on('contacts.add', this.onContactsAdd, this);
    phoneBook.on('contacts.reset', this.onContactsReset, this);
    phoneBook.on('contacts.change:name', this.onContactsNameChange, this);
    phoneBook.on('contacts.address.change', this.onContactsAddressChange, this);
            
```
