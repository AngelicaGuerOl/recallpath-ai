import { ArchiveFlashcardUseCase } from './application/useCases/ArchiveFlashcardUseCase'
import { CreateFlashcardUseCase } from './application/useCases/CreateFlashcardUseCase'
import { GetFlashcardsUseCase } from './application/useCases/GetFlashcardsUseCase'
import { RestoreFlashcardUseCase } from './application/useCases/RestoreFlashcardUseCase'
import { UpdateFlashcardUseCase } from './application/useCases/UpdateFlashcardUseCase'
import { FlashcardRepositoryImpl } from './infrastructure/FlashcardRepositoryImpl'

const flashcardRepository = new FlashcardRepositoryImpl()

export const flashcardDependencies = {
  getFlashcardsUseCase: new GetFlashcardsUseCase(flashcardRepository),
  createFlashcardUseCase: new CreateFlashcardUseCase(flashcardRepository),
  updateFlashcardUseCase: new UpdateFlashcardUseCase(flashcardRepository),
  archiveFlashcardUseCase: new ArchiveFlashcardUseCase(flashcardRepository),
  restoreFlashcardUseCase: new RestoreFlashcardUseCase(flashcardRepository),
}
