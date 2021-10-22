class Entity {
  constructor(x, y) {
    // Physics
    this.mass = 1;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxForce = 0.1;
    this.topSpeed = 10;
    this.actualTopSpeed = 0;

    // energy
    this.energy = 50;
    this.maxEnergy = this.energy;

    // AI
    this.toAvoid = [];
    this.toChase = [];
    this.toEat = [];
    this.avoidPriority = 1;
    this.chasePriority = 1;
    this.perception = 0;
    this.actualPerception = 0;
    this.lightSensibility = -1;
    this.mutationVariation = 0.20;
    this.mutationChance = 0.01;

    // Display
    this.color = [0, 0, 0];
    this.size = 5;

    // Infos
    this.name = "entity";
    this.alive = true;
    this.shape = "triangle";
    this.template = {};

    //CheckMarks
    this.birthDate = getTimeNow();
    this.lastNutritionCheck = this.birthDate;
    this.lastRandomImpulse = this.birthDate;
    this.timeBetweenRandomImpulse = 1;

    //mutableSpecs
    this.mutables = ["maxForce", "topSpeed", "maxEnergy", "avoidPriority", "chasePriority", "perception", "lightSensibility"]

    this.onBirth();
  }

  applyForce(f) {
    f = f.div(this.mass);
    this.acc.add(f);
  }

  // Check if point is inside
  contains(x, y) {
    return isInsideCircle(x, y, this.pos.x, this.pos.y, this.size);
  }

  draw(lineMode, showPerception, showenergy) {
    // Draw transparent circle around entity at perception size
    noStroke();
    if (showPerception) {
      var p = this.actualPerception;
      fill(this.color[0], this.color[1], this.color[2], 31);
      ellipse(this.pos.x, this.pos.y, p * 2, p * 2);
    }

    // Decrease opacity as energy level goes down
    var alpha = 255;
    if (showenergy) alpha = (255 * this.energy) / this.maxEnergy;
    fill(this.color[0], this.color[1], this.color[2], alpha);
    stroke(200);

    // Do not draw entity on line mode
    if (!lineMode) {
      if (this.shape == "triangle") {
        let theta = this.vel.heading() + PI / 2;

        stroke(200);
        strokeWeight(1);
        // Iniciando o desenho do ser
        push();

        // Transformações de posição no canvas
        translate(this.pos.x, this.pos.y);
        rotate(theta);

        // Iniciando o desenho da forma
        beginShape();
        vertex(0, -this.size * 2);
        vertex(-this.size, this.size * 2);
        vertex(this.size, this.size * 2);
        endShape(CLOSE);

        //rotate(-theta);
        translate(-this.pos.x, -this.pos.y);

        // finalizando desenho
        pop();
      } else {
        ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
      }
    }
  }

  // Returns true if ate entity successfully
  eat(e) {
    // Do not eat already dead entities
    if (!e.alive) return false;
    e.kill();

    // Add energy, ensure it does not go over
    this.energy = approach(this.maxEnergy, 0, this.energy, e.energy);
    print(this.energy);

    return true;
  }

  getNearest(entities) {
    var lowestDist = Infinity;

    var e = entities[0];

    for (var i = 0; i < entities.length; i++) {
      var dist = entities[i].pos.dist(this.pos);
      if (dist < lowestDist) {
        lowestDist = dist;
        e = entities[i];
      }
    }

    return e;
  }

  getVisible(entities) {
    var visible = [];
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      if (e === this) continue;
      var c = this.pos;
      if (isInsideCircle(e.pos.x, e.pos.y, c.x, c.y, this.actualPerception)) {
        visible.push(e);
      }
    }
    return visible;
  }

  // Reduces energy level, kills if energy is 0
  hunger(newEntities) {
    let actualTime = getTimeNow();
    if (actualTime - this.lastNutritionCheck > 1) {
      this.energy--;

      if (this.energy <= 0) {
        this.kill();
        this.onStarve(newEntities);
      }

      this.lastNutritionCheck = actualTime;
    }
  }

  kill() {
    this.alive = false;
  }

  onAvoid(e, newEntities) {}
  onChase(e, newEntities) {}
  onDeath(newEntities) {}

  onEatAttempt(e, newEntities) {
    if (this.onEat(e, newEntities)) {
      e.onEaten(this, newEntities);
    }
  }

  onEat(e, newEntities) {
    return this.eat(e);
  }

  onBirth(e, newEntities) {}
  onEaten(e, newEntities) {}
  onFrame(e, newEntities) {}
  onStarve(newEntities) {}
  onWander(newEntities) {}

  // Returns a steering vector
  steer(entities, newEntities) {
    return createVector(0, 0);
  }

  // Returns steering vector towards specific entity
  // End length is acceleration amount * multiplier
  target(e, mult) {
    // var dist = e.pos.dist(this.pos);
    // var unit = p5.Vector.sub(e.pos, this.pos).normalize();
    // return unit.mult(this.maxForce * mult);

    // Gerando vetor velocidade que aponta para o target
    let desired = p5.Vector.sub(e.pos, this.pos);

    // Limitando a magnitude do vetor gerado para a velocidade máxima aplicavel no corpo
    desired.magnitude = this.maxSpeed;

    // Vetor Steer apontando para o ponto desejavel, para girar e transladar o ser para o ponto desejado
    // Vetor aceleração a ser aplicado no corpo
    let steer = desired.sub(this.aceleration);

    // Limitando o vetor para a forma máxima do corpo
    steer.mult(mult);
    steer.limit(this.maxForce);

    return steer;
  }

  update(world) {

    this.actualPerception = this.perception + ((1 - (world.light/5)) * this.lightSensibility * this.perception)
    this.actualTopSpeed = this.topSpeed + ((1 - (world.light/5)) * this.lightSensibility * this.topSpeed)


    this.vel.add(this.acc);
    this.vel.limit(this.actualTopSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  // Accelerate in random direction
  wander(newEntities) {
    this.onWander(newEntities);
    let actualTime = getTimeNow();

    if (actualTime - this.lastRandomImpulse > this.timeBetweenRandomImpulse) {
      var angle = random(TWO_PI);
      var mag = this.maxForce * 10;

      this.lastRandomImpulse = actualTime;
      this.timeBetweenRandomImpulse = random(0, 0.5);

      let resultVector = createVector(
        mag * Math.cos(angle),
        mag * Math.sin(angle)
      );
      return resultVector.limit(this.vel);
    } else {
      return createVector(0, 0);
    }

    // if (actualTime - this.lastRandomImpulse > this.timeBetweenRandomImpulse) {
    //   let perlin = noise(actualTime) * 2;
    //   perlin = (2 * Math.PI) / perlin;

    //   let mag = this.maxForce;
    //   this.lastRandomImpulse = actualTime;
    //   this.timeBetweenRandomImpulse = random(0, 0.5);

    //   return createVector(mag * Math.cos(perlin), mag * Math.sin(perlin));
    // } else {
    //   return createVector(0, 0);
    // }
  }

  mutation(){
    this.mutables.forEach(element => {
      if(Math.random() < this.mutationChance){
        this.mutationValue = this[element] * this.mutationVariation;

        this.mutationValue = (Math.random() < 0.5) ? -this.mutationValue : this.mutationValue;

        this[element] += this.mutationValue
      }

      this.template[element] = this[element];
    });


  }
}
