import { ArchiveDeckUseCase } from './application/useCases/ArchiveDeckUseCase'
import { CreateDeckUseCase } from './application/useCases/CreateDeckUseCase'
import { GetDeckUseCase } from './application/useCases/GetDeckUseCase'
import { GetDecksUseCase } from './application/useCases/GetDecksUseCase'
import { UpdateDeckUseCase } from './application/useCases/UpdateDeckUseCase'
import { DeckRepositoryImpl } from './infrastructure/DeckRepositoryImpl'
import { UnarchiveDeckUseCase } from './application/useCases/UnarchiveDeckUseCase'

const deckRepository = new DeckRepositoryImpl()

export const deckDependencies = {
  getDecksUseCase: new GetDecksUseCase(deckRepository),
  getDeckUseCase: new GetDeckUseCase(deckRepository),
  createDeckUseCase: new CreateDeckUseCase(deckRepository),
  updateDeckUseCase: new UpdateDeckUseCase(deckRepository),
  archiveDeckUseCase: new ArchiveDeckUseCase(deckRepository),
  unarchiveDeckUseCase: new UnarchiveDeckUseCase(deckRepository),
}
