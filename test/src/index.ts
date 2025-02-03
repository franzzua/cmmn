import { Cell } from "@cmmn/core";
import { Component } from "@cmmn/uhtml";
import {SmallNumber} from "./types";
const cell = new Cell<SmallNumber>(6);
const cell2 = new Cell(1);
console.log('cell', cell.value);
