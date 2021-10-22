function createEntity(x, y, template, bMustMutate=true) {
  var e = new Entity(x, y);

  // Define max energy from energy if necessary
  if (
    typeof template.energy !== "undefined" &&
    typeof template.maxEnergy === "undefined"
  ) {
    e.maxEnergy = template.energy;
  }
  // Define energy from max energy if necessary
  if (
    typeof template.energy === "undefined" &&
    typeof template.maxEnergy !== "undefined"
  ) {
    e.energy = template.maxEnergy;
  }

  // Fill in all keys
  var keys = Object.keys(template);
  let newTemplate = {};

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    e[key] = template[key];
    newTemplate[key] = template[key]
  }

  e.template = template

  if(bMustMutate) e.mutation()

  return e;
}

// Steering functions

function nearestTarget(entities, newEntities) {
  var sum = createVector(0, 0);

  // Pursuing a single target
  var targets = getByName(entities, this.toChase);
  if (targets.length > 0) {
    var e = this.getNearest(targets);
    if (e !== this) {
      if (chaseLines) {
        if (lineMode) {
          stroke(255);
        } else {
          stroke(this.color[0], this.color[1], this.color[2], 127);
        }
        line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
      }
      this.onChase(e, newEntities);
      sum.add(this.target(e, this.chasePriority));
    }
  }

  // Avoidance
  targets = getByName(entities, this.toAvoid);
  for (var i = 0; i < targets.length; i++) {
    var e = targets[i];
    if (e === this) continue;
    if (avoidLines) {
      if (lineMode) {
        stroke(255);
      } else {
        stroke(0, 0, 255);
      }
      line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
    }
    this.onAvoid(e, newEntities);
    sum.add(this.target(e, this.avoidPriority * -1));
  }

  return sum;
}

function multiTarget(entities, newEntities) {
  var sum = createVector(0, 0);

  // Pursuing targets
  var targets = getByName(entities, this.toChase);
  for (var i = 0; i < targets.length; i++) {
    var e = targets[i];
    if (e === this) continue;
    if (chaseLines) {
      if (lineMode) {
        stroke(255);
      } else {
        stroke(this.color[0], this.color[1], this.color[2], 191);
      }
      line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
    }
    this.onChase(e, newEntities);
    sum.add(this.target(e, this.chasePriority));
  }

  // Avoidance
  targets = getByName(entities, this.toAvoid);
  for (var i = 0; i < targets.length; i++) {
    var e = targets[i];
    if (e === this) continue;
    if (avoidLines) {
      if (lineMode) {
        stroke(255);
      } else {
        stroke(0, 0, 255);
      }
      line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
    }
    this.onAvoid(e, newEntities);
    sum.add(this.target(e, this.avoidPriority * -1));
  }

  return sum;
}

// Templates

var templates = {};

templates.food = {
  maxForce: 0,
  color: [0, 255, 20],
  name: "food",
  topSpeed: 0,
  hunger: function () {},
  shape: "circle",
};

templates.fungus = {
  maxForce: 0,
  color: [102, 51, 153],
  name: "fungus",
  energy: 37,
  perception: 10,
  size: 10,
  toChase: ["prey"],
  toEat: ["prey"],
  topSpeed: 0,
  shape: "circle",
  onEat: function (e, newEntities) {
    if (this.eat(e)) {
      if (random(2) < 1) {
        var x = this.pos.x + random(-20, 20);
        var y = this.pos.y + random(-20, 20);
        newEntities.push(createEntity(x, y, templates.food));
      }
      var x = this.pos.x + random(-100, 100);
      var y = this.pos.y + random(-100, 100);
      newEntities.push(createEntity(x, y, templates.fungus));
    }
  },
};

templates.pred = {
  maxForce: 1.0,
  avoidPriority: 0.5,
  chasePriority: 4,
  color: [207, 0, 15],
  name: "pred",
  energy: 20,
  perception: 150,
  size: 12,
  steer: multiTarget,
  toAvoid: ["pred"],
  toChase: ["prey"],
  toEat: ["prey"],
  topSpeed: 4.8,
  lightSensibility: 1,
  mutationChance : 0.10,
  onDeath: function (newEntities) {
    if (random(3) >= 2) return;
    var x = this.pos.x;
    var y = this.pos.y;
    newEntities.push(createEntity(x, y, templates.food));
  },
  onEatAttempt: function (e, newEntities) {
    this.vel.mult(0);
    if (random(5) >= 2) return;
    if (this.onEat(e, newEntities)) e.onEaten(this, newEntities);
  },
  onEat: function (e, newEntities) {
    if (this.eat(e)) {
      if (random(5) >= 1) return false;
      var x = this.pos.x + random(-20, 20);
      var y = this.pos.y + random(-20, 20);
      newEntities.push(createEntity(x, y, templates.pred));
    }
  },
};

templates.prey = {
  maxForce: 3,
  chasePriority: 2,
  color: [0, 87, 203],
  name: "prey",
  energy: 10,
  perception: 100,
  size: 8,
  steer: nearestTarget,
  toChase: ["food"],
  toEat: ["food"],
  toAvoid: ["pred"],
  topSpeed: 4.5,
  mutationChance: 0.5,
  onEat: function (e, newEntities) {
    if (this.eat(e)) {
      if (random(5) >= 4.5) {
        newEntities.push(
          createEntity(
            this.pos.x + random(-14, 14),
            this.pos.y + random(-14, 14),
            this.template
          )
        );
      }
    }
  },
};

templates.hive = {
  maxForce: 0,
  color: [54, 215, 183],
  name: "hive",
  nutrition: 500,
  perception: 100,
  size: 3,
  shape: "circle",
  steer: nearestTarget,
  toChase: ["fungus", "pred", "prey"],
  topSpeed: 0,
  swarm: 3,
  onChase: function (e, newEntities) {
    if (random(15) >= 1 || this.swarm <= 0) return;
    var x = this.pos.x + random(-20, 20);
    var y = this.pos.y + random(-20, 20);
    var s = createEntity(x, y, templates.swarm);
    s.hive = this;
    newEntities.push(s);
    this.swarm--;
  },
};

templates.swarm = {
  maxForce: 0.4,
  chasePriority: 4,
  color: [100, 100, 80],
  name: "swarm",
  energy: 5,
  perception: 75,
  size: 3,
  steer: nearestTarget,
  toAvoid: ["swarm"],
  toChase: ["fungus", "pred", "prey"],
  toEat: ["fungus", "pred", "prey"],
  topSpeed: 4,
  bees: 5,
  onChase: function (e, newEntities) {
    if (random(5) >= 1 || this.bees <= 0) return;
    var x = this.pos.x + random(-20, 20);
    var y = this.pos.y + random(-20, 20);
    var s = createEntity(x, y, templates.swarmer);
    newEntities.push(s);
    this.bees--;
  },

  onDeath: function (newEntities) {
    this.hive.swarm += 1;
    if (random(3) >= 2) return;
    newEntities.push(createEntity(this.pos.x, this.pos.y, templates.food));
  },
  onEatAttempt: function (e, newEntities) {
    if (typeof this.hive !== "undefined" && !this.hive.alive) {
      this.hive = undefined;
    }
    this.vel.mult(0);
    if (random(15) >= 1) return;
    var success;
    if (typeof this.hive === "undefined") {
      success = this.onEat(e, newEntities);
    } else {
      success = this.hive.onEat(e, newEntities);
    }
    if (!success) return;
    e.onEaten(this, newEntities);
    if (random(23) >= 1) return;
    newEntities.push(createEntity(this.pos.x, this.pos.y, templates.hive));
    if (typeof this.hive !== "undefined") return;
    //newEntities.push(createEntity(this.pos.x, this.pos.y, templates.swarm));
  },

  onFrame: function(e, newEntities){
    if(this.bees <= 0){
      this.kill();
    }
  }
};

templates.swarmer = {
  maxForce: 0.4,
  color: [249, 191, 59],
  name: "swarmer",
  nutrition: 25,
  perception: 50,
  avoidPriority: 0.5,
  chasePriority: 4,
  size: 1,
  steer: nearestTarget,
  toChase: ["fungus", "pred", "prey"],
  toEat: ["fungus", "pred", "prey"],
  topSpeed: 4,
  onEatAttempt: function (e, newEntities) {
    this.vel.mult(0);
    if (random(15) >= 1) return;
    if (this.onEat(e, newEntities)) e.onEaten(this, newEntities);
    this.kill();
  },

};
