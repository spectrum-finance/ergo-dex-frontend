import { FullTxIn, InputSelector, TxHash } from '@spectrumlabs/cardano-dex-sdk';
import { TxOut } from '@spectrumlabs/cardano-dex-sdk/build/main/cardano/entities/txOut';
import { Value } from '@spectrumlabs/cardano-dex-sdk/build/main/cardano/entities/value';
import { CollateralSelector } from '@spectrumlabs/cardano-dex-sdk/build/main/cardano/wallet/collateralSelector';
import { InputCollector } from '@spectrumlabs/cardano-dex-sdk/build/main/cardano/wallet/inputSelector';
import { catchError, filter, first, map, of, switchMap } from 'rxjs';

import { selectUtxos } from '../../wallet/common/BoxSelector';
import { selectedWallet$ } from '../../wallet/wallet';

export class DefaultInputSelector implements InputSelector {
  select(
    inputs: FullTxIn[],
    target: Value,
    excludedInputs: FullTxIn[] = [],
  ): FullTxIn[] | Error {
    let inputsOrError: TxOut[] | Error;

    try {
      inputsOrError = selectUtxos(
        inputs.map((i) => i.txOut),
        target,
        excludedInputs.map((ei) => ei.txOut),
      );
    } catch (e: any) {
      return e;
    }
    if (inputsOrError instanceof Error) {
      return inputsOrError;
    } else {
      return inputsOrError.map((txOut) => ({ txOut }));
    }
  }

  selectById(
    inputs: FullTxIn[],
    txHash: TxHash,
    index: number,
  ): FullTxIn[] | Error {
    const inputOrError: FullTxIn | undefined = inputs.find(
      (utxo) => utxo.txOut.index === index && utxo.txOut.txHash === txHash,
    );

    if (!inputOrError) {
      return new Error('insufficient funds');
    } else {
      return [inputOrError];
    }
  }
}

export class DefaultInputCollector implements InputCollector {
  getInputs(): Promise<FullTxIn[]> {
    return selectedWallet$
      .pipe(
        first(),
        switchMap((wallet) => {
          if (wallet) {
            return wallet.getUtxos();
          }
          return of([]);
        }),
        map((utxos) => utxos.map((txOut) => ({ txOut }))),
      )
      .toPromise() as Promise<FullTxIn[]>;
  }
}

export class DefaultCollateralSelector implements CollateralSelector {
  getCollateral(amount: bigint): Promise<FullTxIn[]> {
    return selectedWallet$
      .pipe(
        filter(Boolean),
        first(),
        switchMap((wallet) => wallet.getCollateral(amount)),
        map((utxos) => utxos.map((txOut) => ({ txOut }))),
        catchError(() => {
          return of([]);
        }),
      )
      .toPromise() as Promise<FullTxIn[]>;
  }
}
