const GameObject = require('./GameObject.js');
const LevelObject = require('./LevelObject.js');
const EventFunctions = require('./EventFunctions.js');
const MeshGenerator = require('./MeshGenerator.js');
const request = require('request');
const assert = require('assert');

const Validator = require('jsonschema').Validator;
const validator = new Validator();
validator.addSchema(GameObject.prototype.schema);
validator.addSchema(LevelObject.prototype.schema);

exports.importGameObject = function(filename) {
    const object = require(`../../${filename}`);
    validator.validate(object, 'Level', {
        throwError: true
    });
    EventFunctions.injectEventFunctions(object);
    MeshGenerator.injectMeshGenerator(object);
    return new GameObject(object);
}

exports.loadLevel = async function({
    levelName,
    url
}, runtimeContext) {
    let object;
    if (url) {
        object = await request.get(url);
    } else {
        object = require(`../../${levelName}`);
    }

    validator.validate(object, 'Level', {
        throwError: true
    });

    EventFunctions.injectEventFunctions(object);
    for (var i = object.gameObjects.length - 1; i >= 0; i--) {
        if (typeof(object.gameObjects[i]) === 'string') {
            object.gameObjects[i] = exports.importGameObject(object.gameObjects[i]);
        }
    }

    runtimeContext.addToScene = this.addToScene.bind(this, runtimeContext.scene);
    const level = new LevelObject(object, runtimeContext);
    if (!this.currentLevel) {
        this.currentLevel = level.name;
    }
    this.levelCache[level.name] = level;
    return level;
}

exports.levelCache = {};

exports.fetchLevel = async function({
    current,
    levelName,
    url
}, runtimeContext) {
    if (current && this.levelCache[this.currentLevel]) {
        return this.levelCache[this.currentLevel];
    }
    return this.levelCache[levelName] || await this.loadLevel({
        levelName,
        url
    }, runtimeContext);
}

exports.addToScene = function(scene, actor) {
    console.log(actor);
    if (typeof actor.mesh === 'function')
        scene.add(actor.mesh());
    else
        scene.add(actor.mesh);
}