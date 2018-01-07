import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { Game } from '../model/game';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.css']
})
export class ScoreComponent implements OnInit {

  game: Game;

  constructor(
    private gameService: GameService
  ) { }

  ngOnInit() {
    this.game = this.gameService.getGame();
  }

  onNextLevel() {
    this.gameService.calculateScore();
  }

}
