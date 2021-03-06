const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const Db = require("./db");
const nullActionFunction = () => {
  //console.log("no action");
};

class Day {

  constructor(dark) {
    this.dark = dark;
    this.voter = {};
  }

 


  getVoteList() {
    const result = [];

    for (let [id, value] of Object.entries(dark.roundActions)) {
      const {isDie} = value;
      if (!isDie) {
        result.push({id});
      }

    }

    return result;

  }




  voteToKill({id, playerId}) {

    if (!this.voter[id]) {
      this.voter[id] = {playerId};
    }

    
  }
}




class Dark {
  
  constructor() {
    this.reset();
    this.actionFunctionMapping = {
      guard:[{
        act: this.guardProtect,
        darkTimeSec: 15,
        msg: "守衛守人",
        actRoleType: "GUARD",
        res: this.guardProtectList,
      },],
      hunter: [
        
        {
          act: this.hunterKill,
          darkTimeSec: 15,
          msg: "獵人獵殺",
          actRoleType: "HUNTER",
          res: this.hunterKillList,
        },
      ],
      witch: [
        
        {
          act: this.witchCure,
          darkTimeSec: 15,
          msg: "女巫救人",
          actRoleType: "WITCH_SAVE",
          res: this.witchCuringList,
        },
        {
          act: this.witchKill,
          darkTimeSec: 15,
          msg: "女巫毒人",
          actRoleType: "WITCH_KILL",
          res: this.witchKillingList,
        }
      ],
      wolf: [
        {
          act: this.wolfKill,
          darkTimeSec: 15,
          msg: "狼人殺人",
          res: this.wolfKillingList,
          actRoleType: "WOLF",
        },
      ],
      prophet: [
        {
          act: this.prophetCheck,
          darkTimeSec: 15,
          msg: "預言家驗人",
          res: this.prophetCheckList,
          actRoleType: "PROPHET",
        },
      ],
    };
  }

  reset() {
    this.playerFunctionNameMapping = {};
    this.isStart = false;
    this.remainTime = 0;
    this.actionFunction = nullActionFunction;
    this.resultFunction = nullActionFunction;
    this.roleFunctionName = null;
    this.darkDay = 0;
    this.actionList = [];
    this.roundActions = {};
    this.currentAction = {};
    this.players = [];
    this.actRoleType = null;

    this.witchControl = { isPoisonUsed: false, isCureUsed: false };

  }

  assignDarkRole({ id, roleFunctionName, camp }) {
    this.roundActions[id] = {
      playerId: id,
      isDie: 0,
      wolfKillDay: 0,
      revealedRole: [],
      camp,
    };
    this.playerFunctionNameMapping[id] = { roleFunctionName };
  }

  characterCheckAction({ role, id, playerId, errorMsg }) {
    if (
      !this.playerFunctionNameMapping[id] &&
      this.playerFunctionNameMapping[id].roleFunctionName !== role
    ) {
      console.log(errorMsg);
      return { msg: errorMsg };
    }

    if (playerId === -1) {
      this.currentAction = {};
      return { hasError: false };
    }

    const { roundActions } = this;

    if (!roundActions[playerId]) {
      console.log("the player is not exist");
      return { msg: "The player is not exist", hasError: true };
    } else if (roundActions[playerId].die) {
      console.log("the player is die");
      return { msg: "The player is die", hasError: true };
    }

    return { hasError: false };
  }

  prophetCheck({ id, playerId }) {
    const result = this.characterCheckAction({
      role: "prophet",
      id,
      playerId,
      errorMsg: "You are not prophet",
    });

    if (result.hasError) {
      return result;
    }

    this.currentAction = { playerId, prophetCheckDay: this.darkDay, id };
    return { hasError: false };
  }

  prophetCheckList({ id }) {
    if (!this.playerFunctionNameMapping[id]) {
      return [];
    }

    if (this.playerFunctionNameMapping[id].roleFunctionName !== "prophet") {
      return [];
    }

    if( this.roundActions[id].isDie) {
      return [];
    }


    const result = [];
    for (let [key, value] of Object.entries(this.roundActions)) {
      const { isDie, playerId, prophetCheckDay } = value;

      if (!isDie && !prophetCheckDay) {
        if (playerId === this.currentAction.playerId) {
          const { prophetCheckDay } = this.currentAction;
          result.push({ id: playerId, isKill: prophetCheckDay });
        } else {
          result.push({ id: playerId });
        }
      }
    }

    return result;
  }

  guardProtect({id, playerId}) {
    const result = this.characterCheckAction({
      role: "guard",
      id,
      playerId,
      errorMsg: "You are not guard",
    });

    if (result.hasError) {
      return result;
    }

    if (!this.roundActions[playerId]) {
      this.currentAction = {};
      return;
    }

    this.currentAction = { playerId, guardProtectDay: this.darkDay, id };
    return { hasError: false };

  }

  guardProtectList({id, playerId}) {
    if (!this.playerFunctionNameMapping[id]) {
      return [];
    }

    if (this.playerFunctionNameMapping[id].roleFunctionName !== "guard") {
      return [];
    }

    if( this.roundActions[id].isDie) {
      return [];
    }

    const result = [];
    for (let [key, value] of Object.entries(this.roundActions)) {
      const { isDie, playerId, guardProtectDay } = value;

      if (guardProtectDay === this.darkDay - 1) {
        continue;
      }


      if (!isDie) {
        if (playerId === this.currentAction.playerId) {
          const { guardProtectDay } = this.currentAction;
          result.push({ id: playerId, isKill: guardProtectDay });
        } else {
          result.push({ id: playerId });
        }
      }
    }
    return result;
  }



  hunterKill({ id, playerId }) {
    const result = this.characterCheckAction({
      role: "hunter",
      id,
      playerId,
      errorMsg: "You are not hunter",
    });

    if (result.hasError) {
      return result;
    }

    if (!this.roundActions[playerId]) {
      this.currentAction = {};
      return;
    }

    const status = this.roundActions[id];
    const { wolfKillDay, witchKillDay } = status;
    if (wolfKillDay === this.darkDay) {
      if (witchKillDay !== this.darkDay) {
        this.currentAction = { playerId, hunterKillDay: this.darkDay };
      }
    }
  }

  hunterKillList({ id }) {
    if (!this.playerFunctionNameMapping[id]) {
      return [];
    }

    if (this.playerFunctionNameMapping[id].roleFunctionName !== "hunter") {
      return [];
    }

    if( this.roundActions[id].isDie) {
      return [];
    }


    const result = [];
    const status = this.roundActions[id];
    const { wolfKillDay, witchKillDay } = status;
    if (wolfKillDay === this.darkDay) {
      if (witchKillDay !== this.darkDay) {
        for (let [key, value] of Object.entries(this.roundActions)) {
          const { isDie, playerId } = value;

          if (playerId === id) {
            continue;
          }


          if (!isDie) {
            if (playerId === this.currentAction.playerId) {
              const { hunterKillDay } = this.currentAction;
              result.push({ id: playerId, isKill: hunterKillDay });
            } else {
              result.push({ id: playerId });
            }
          }
        }
      }
    }

    return result;

  }

  wolfKill({ id, playerId }) {
    const result = this.characterCheckAction({
      role: "wolf",
      id,
      playerId,
      errorMsg: "You are not wolf",
    });

    if (result.hasError) {
      return result;
    }

    this.currentAction = { playerId, wolfKillDay: this.darkDay };

    return { hasError: false };
  }

  wolfKillingList({ id }) {
    if (!this.playerFunctionNameMapping[id]) {
      return [];
    }

    if (this.playerFunctionNameMapping[id].roleFunctionName !== "wolf") {
      return [];
    }

    if( this.roundActions[id].isDie) {
      return [];
    }

    const result = [];
    for (let [key, value] of Object.entries(this.roundActions)) {
      const { isDie, playerId } = value;

      if (!isDie) {
        if (playerId === this.currentAction.playerId) {
          const { wolfKillDay } = this.currentAction;
          result.push({ id: playerId, isKill: wolfKillDay });
        } else {
          result.push({ id: playerId });
        }
      }
    }

    return result;
  }

  witchKill({ id, playerId }) {
    const result = this.characterCheckAction({
      role: "witch",
      id,
      playerId,
      errorMsg: "You are not witch",
    });

    if (result.hasError) {
      return result;
    }

    if (!this.roundActions[playerId]) {
      this.currentAction = {};
      return;
    }

    for (let [key, value] of Object.entries(this.roundActions)) {
      const { witchKillDay, witchCureDay, isDie } = value;
      if (witchKillDay || witchCureDay === this.darkDay || isDie) {
        return;
      }
    }

    this.currentAction = { playerId, witchKillDay: this.darkDay };
  }

  witchKillingList({ id }) {
    if (!this.playerFunctionNameMapping[id]) {
      return [];
    }

    if (this.playerFunctionNameMapping[id].roleFunctionName !== "witch") {
      return [];
    }

    if( this.roundActions[id].isDie) {
      return [];
    }

    const result = [];
    let isNotAvaiable = false;

    for (let [key, value] of Object.entries(this.roundActions)) {
      const { isDie, playerId } = value;
      
      if (value.witchKillDay || value.witchCureDay === this.darkDay) {
        isNotAvaiable = true;
        break;
      }

      if (!isDie) {
        if (playerId === this.currentAction.playerId) {
          const { witchKillDay } = this.currentAction;
          result.push({ id: playerId, isKill: witchKillDay });
        } else {
          result.push({ id: playerId });
        }
      }
    }

    if (isNotAvaiable) {
      return [];
    }

    return result;
  }
  witchCure({ playerId }) {
    if (!this.roundActions[playerId]) {
      this.currentAction = {};
      return;
    }

    if (this.roundActions[playerId].wolfKillDay === this.darkDay) {
      this.currentAction = { playerId, witchCureDay: this.darkDay };
    }
  }

  witchCuringList({ id }) {
    if (!this.playerFunctionNameMapping[id]) {
      return [];
    }

    if (this.playerFunctionNameMapping[id].roleFunctionName !== "witch") {
      return [];
    }

    if( this.roundActions[id].isDie) {
      return [];
    }

    const result = [];
    let isNotAvaiable = false;
    for (let [key, value] of Object.entries(this.roundActions)) {
      const { isDie, playerId, wolfKillDay } = value;

      if (id === playerId) {
        continue
      }

      if (value.witchCureDay || value.witchKillDay === this.darkDay) {
        isNotAvaiable = true;
        break;
      }
      if (!isDie && wolfKillDay === this.darkDay) {
        if (playerId === this.currentAction.playerId) {
          const { witchCureDay } = this.currentAction;
          result.push({ id: playerId, isKill: witchCureDay });
        } else {
          result.push({ id: playerId });
        }
      }
    }

    if (isNotAvaiable) {
      return [];
    }

    return result;
  }

  addAction() {
    const { playerId, id, prophetCheckDay } = this.currentAction;

    if (this.roundActions[playerId]) {
      this.roundActions[playerId] = {
        ...this.roundActions[playerId],
        ...this.currentAction,
      };
    } else if (playerId) {
      this.roundActions[playerId] = { ...this.currentAction };
    }

    if (prophetCheckDay) {
      this.roundActions[id].revealedRole.push({
        revealedRole: this.roundActions[id].camp,
        playerId,
      });
    }
  }

  getRevealedRole({ id }) {
    if (this.roundActions[id]) {
      return this.roundActions[id].revealedRole;
    }

    return [];
  }

  getResult() {
    const result = { ...this.roundActions };
    for (let [id, value] of Object.entries(this.roundActions)) {
      const { wolfKillDay, witchCureDay, witchKillDay, hunterKillDay,guardProtectDay  } = value;

      if (wolfKillDay === this.darkDay) {
        if (!(witchCureDay === this.darkDay ^ guardProtectDay  === this.darkDay)) {
          result[id] = {
            ...result[id],
            isDie: this.darkDay,
            wolfKillDay,
            witchCureDay,
          };
        } else {
          result[id] = {
            ...result[id],
            wolfKillDay,
            witchCureDay,
          };
        }
      }

      if (witchKillDay === this.darkDay) {
        result[id] = { ...result[id], isDie: this.darkDay, witchKillDay };
      }

      if (hunterKillDay === this.darkDay) {
        result[id] = { ...result[id], isDie: this.darkDay, hunterKillDay };
      }

    }
    this.roundActions = result;
  }

  async iniActionList() {
    const template = await Db.getEnabledTemplate();
    const { name } = template;
    const roles = await Db.getAllTemplateRole({ name });
    const actionList = [];
    roles.forEach((r) => {
      const { functionName } = r;
      const fList = this.actionFunctionMapping[functionName];

      if (fList) {
        fList.forEach((f) => {
          const { act, darkTimeSec, res, actRoleType } = f;

          actionList.push({
            act,
            roleFunctionName: functionName,
            darkTimeSec,
            res,
            actRoleType,
          });
        });
      }
    });

    return actionList;
  }

  async start() {
    if (this.isStart) {
      return { msg: "the dark is start" };
    }

    /*
    this.roundActions = {
      0: { playerId: 0, isDie: 0, wolfKillDay: 0 },
      1: { playerId: 1, isDie: 0, wolfKillDay: 0 },
      2: { playerId: 2, isDie: 0, wolfKillDay: 0 },
      3: { playerId: 3, isDie: 0, wolfKillDay: 0 },
    };
    */

    this.isStart = true;
    this.darkDay += 1;
    //const roles = [{ name: "狼人", darkTimeSec: 10, roleFunction: "狼人" }];
    /*
    const actionList = [
      { act: this["wolfKill"], darkTimeSec: 4, roleFunctionName: "wolfKill" },
      { act: this["wolfKill"], darkTimeSec: 4, roleFunctionName: "wolfKill" },
    ];
    */

    const actionList = await this.iniActionList();
    console.log(actionList, "action list");

    for (let i = 0; i < actionList.length; i += 1) {
      const {
        darkTimeSec,
        act,
        roleFunctionName,
        res,
        actRoleType,
      } = actionList[i];
      this.actionFunction = act;
      this.resultFunction = res;
      this.roleFunctionName = roleFunctionName;
      this.actRoleType = actRoleType;
      let remainTime = darkTimeSec;

      while (remainTime) {
        await timeout(1000);
        remainTime -= 1;
        this.remainTime = remainTime;
      }

      this.addAction();
    }

    this.getResult();
    this.isStart = false;
  }
}

const dark = new Dark();

module.exports = { dark };
