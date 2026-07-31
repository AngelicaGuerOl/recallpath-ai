import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import { PageContainer } from '../../../../shared/ui/layout/PageContainer';
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog';
import { useGenerationRun } from '../../hooks/useGeneration';
import { useDeck } from '../../../decks/ui/hooks/useDeck';
import { useGeneratedFlashcards } from '../../../flashcards/ui/hooks/useGeneratedFlashcards';
import {
  useApproveFlashcard,
  useRejectFlashcard,
  useApproveBatchFlashcards
} from '../../../flashcards/ui/hooks/useFlashcardMutations';

export function ReviewGenerationPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const id = Number(runId);
  const [confirmApproveAllOpen, setConfirmApproveAllOpen] = useState(false);

  // Poll the run status until it's completed or failed
  const runQuery = useGenerationRun(id);
  const run = runQuery.data;

  // Re-fetch every 3 seconds if pending/processing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (run?.status === 'PENDING' || run?.status === 'PROCESSING') {
      interval = setInterval(() => {
        runQuery.refetch();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [run?.status, runQuery]);

  const deckId = run?.deckId;
  const deckQuery = useDeck(deckId || 0);
  const deck = deckQuery.data;

  const flashcardsQuery = useGeneratedFlashcards(
    run?.status === 'COMPLETED' ? id : undefined
  );
  
  const flashcards = flashcardsQuery.data ?? [];

  const approveMut = useApproveFlashcard(deckId!);
  const rejectMut = useRejectFlashcard(deckId!);
  const approveBatchMut = useApproveBatchFlashcards(deckId!);

  const handleApprove = (cardId: number) => {
    approveMut.mutate(cardId);
  };

  const handleReject = (cardId: number) => {
    rejectMut.mutate(cardId);
  };

  const handleApproveAll = () => {
    setConfirmApproveAllOpen(true);
  };

  const confirmApproveAll = () => {
    const ids = flashcards.map(c => c.id);
    if (ids.length > 0) {
      approveBatchMut.mutate(ids, {
        onSuccess: () => {
          setConfirmApproveAllOpen(false);
          navigate(`/decks/${deckId}`);
        }
      });
    }
  };

  const translateDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Básica';
      case 'MEDIUM': return 'Intermedia';
      case 'HARD': return 'Avanzada';
      default: return difficulty;
    }
  };

  if (runQuery.isLoading) {
    return (
      <PageContainer>
        <Stack sx={{ alignItems: 'center', py: 8 }} spacing={2}>
          <CircularProgress />
          <Typography>Cargando información de generación...</Typography>
        </Stack>
      </PageContainer>
    );
  }

  if (runQuery.isError || !run) {
    return (
      <PageContainer>
        <Alert severity="error">No se encontró el proceso de generación.</Alert>
      </PageContainer>
    );
  }

  const isPending = run.status === 'PENDING' || run.status === 'PROCESSING';
  const isFailed = run.status === 'FAILED';
  const isCompleted = run.status === 'COMPLETED';

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Box>
          <Button component={Link} to={`/documents/${run.documentId}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
            Volver al documento
          </Button>
          <Typography variant="h4" component="h1">
            Revisión de tarjetas generadas
          </Typography>
          <Typography color="text.secondary">
            Proceso #{run.id} • Conjunto destino: {deck ? deck.name : `ID ${run.deckId}`}
          </Typography>
        </Box>

        {isFailed && (
          <Alert severity="error">
            La generación falló: {run.errorMessage}
          </Alert>
        )}

        {isPending && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">Generando tarjetas...</Typography>
            <Typography color="text.secondary">
              Esto puede tardar unos segundos. Por favor, espera.
            </Typography>
          </Paper>
        )}

        {isCompleted && (
          <>
            {flashcardsQuery.isLoading ? (
              <CircularProgress />
            ) : flashcards.length === 0 ? (
              <Alert severity="info">
                No hay tarjetas pendientes de revisión para esta generación (o ya fueron procesadas).
              </Alert>
            ) : (
              <Box>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {flashcards.length} tarjetas encontradas
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<DoneAllIcon />}
                    onClick={handleApproveAll}
                    disabled={approveBatchMut.isPending}
                  >
                    Aprobar todas
                  </Button>
                </Stack>

                <Stack spacing={2}>
                  {flashcards.map(card => (
                    <Card key={card.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Término
                            </Typography>
                            <Chip size="small" label={translateDifficulty(card.difficulty)} />
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {card.term}
                          </Typography>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Typography variant="subtitle2" color="text.secondary">
                            Definición
                          </Typography>
                          <Typography variant="body1">
                            {card.definition}
                          </Typography>

                          {card.sourceExcerpt && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} gutterBottom>
                                Fragmento fuente (Página {card.sourcePage}):
                              </Typography>
                              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                "{card.sourceExcerpt}"
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                        <Button 
                          color="error" 
                          startIcon={<CloseIcon />}
                          onClick={() => handleReject(card.id)}
                          disabled={rejectMut.isPending || approveMut.isPending}
                        >
                          Rechazar
                        </Button>
                        <Button 
                          color="success" 
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApprove(card.id)}
                          disabled={approveMut.isPending || rejectMut.isPending}
                        >
                          Aprobar
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Stack>

      <ConfirmDialog
        open={confirmApproveAllOpen}
        title="Aprobar tarjetas"
        description={`¿Aprobar las ${flashcards.length} tarjetas pendientes?\n\nLas tarjetas aprobadas se agregarán al conjunto y estarán disponibles para practicar.`}
        confirmLabel="Aprobar todas"
        onClose={() => setConfirmApproveAllOpen(false)}
        onConfirm={confirmApproveAll}
        loading={approveBatchMut.isPending}
      />
    </PageContainer>
  );
}
