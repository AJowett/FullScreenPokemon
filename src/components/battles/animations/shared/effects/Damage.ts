import { component } from "babyioc";
import { IDamageEffect, IMoveAction, IStatistic, ITeamAndAction } from "battlemovr";
import { GeneralComponent } from "gamestartr";

import { FullScreenPokemon } from "../../../../../FullScreenPokemon";
import { IPokemon } from "../../../../Battles";
import { Calculator } from "./damage/Calculator";

/**
 * Runs damage effect animations for FullScreenPokemon instances.
 */
export class Damage<TGameStartr extends FullScreenPokemon> extends GeneralComponent<TGameStartr> {
    /**
     * Calculates damage dealt from battle moves.
     */
    @component(Calculator)
    private readonly calculator: Calculator<TGameStartr>;

    /**
     * Runs the damage animation for a battle move effect.
     *
     * @param teamAndAction   Team and move being performed.
     * @param effect   Effect of the move whose damage is being calculated.
     * @param onComplete   Handler for when this is done.
     */
    public run(teamAndAction: ITeamAndAction<IMoveAction>, effect: IDamageEffect, onComplete: () => void): void {
        const statistic: IStatistic = teamAndAction.target.actor.statistics.health;
        const amount: number = this.calculator.calculateDamage(teamAndAction, effect);

        this.gameStarter.battles.decorations.health.animatePokemonHealthBar(
            teamAndAction.target.team,
            statistic.current,
            statistic.current - amount,
            (): void => {
                if (statistic.current !== 0) {
                    onComplete();
                    return;
                }

                this.gameStarter.battles.animations.getTeamAnimations(teamAndAction.target.team)
                    .actions.effects.fainting.run(
                        teamAndAction.target.actor as IPokemon,
                        teamAndAction.target.team, onComplete);
            });

        statistic.current -= amount;
    }
}
