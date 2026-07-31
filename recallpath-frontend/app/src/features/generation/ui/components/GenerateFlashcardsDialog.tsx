
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateGenerationRun } from '../../hooks/useGeneration';
import { useDecks } from '../../../decks/ui/hooks/useDecks';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../../shared/api/apiError';

const generateSchema = z.object({
  deckId: z.number().min(1, 'Selecciona un conjunto'),
  requestedCardCount: z.number().min(1).max(50),
  language: z.string().min(1, 'Selecciona un idioma'),
  difficulty: z.string().min(1, 'Selecciona una dificultad'),
  contentTypes: z.array(z.string()).min(1, 'Selecciona al menos un tipo de contenido'),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

interface GenerateFlashcardsDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: number;
  pageFrom: number;
  pageTo: number;
}

export function GenerateFlashcardsDialog({
  open,
  onClose,
  documentId,
  pageFrom,
  pageTo
}: GenerateFlashcardsDialogProps) {
  const navigate = useNavigate();
  const { data: deckPage } = useDecks({ page: 0, size: 100 });
  const decks = deckPage?.content || [];
  const createRun = useCreateGenerationRun();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      deckId: 0,
      requestedCardCount: 10,
      language: 'Español',
      difficulty: 'MEDIUM',
      contentTypes: ['KEY_CONCEPTS']
    }
  });

  const onSubmit = (data: GenerateFormValues) => {
    createRun.mutate(
      {
        documentId,
        data: {
          ...data,
          pageFrom,
          pageTo
        }
      },
      {
        onSuccess: (response: { id: number }) => {
          onClose();
          reset();
          navigate(`/generation-runs/${response.id}/review`);
        }
      }
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => { if (!createRun.isPending) onClose(); }} 
      maxWidth="sm" 
      fullWidth
      sx={{ '& .MuiDialog-paper': { display: 'flex', flexDirection: 'column' } }}
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <DialogTitle>Configurar Generación</DialogTitle>
        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          <Stack spacing={3}>
            {createRun.isError && (
              <Alert severity="error">
                {(() => {
                  const err = createRun.error as ApiError;
                  if (err?.status === 400) return 'La configuración de generación no es válida.';
                  if (err?.status === 404) return 'No se encontró el documento o el conjunto seleccionado.';
                  if (err?.status === 409) {
                    if (err.message?.toLowerCase().includes('duplicad') || err.message?.toLowerCase().includes('ya existen')) {
                      return 'Algunas tarjetas ya existen en el conjunto.';
                    }
                    return 'El documento no está listo para extracción o el conjunto está archivado.';
                  }
                  return 'Ocurrió un error al iniciar la generación. Intenta de nuevo.';
                })()}
              </Alert>
            )}

            <Alert severity="info">
              Se generarán tarjetas a partir del texto extraído de las páginas {pageFrom} a {pageTo}.
            </Alert>

            <Controller
              name="deckId"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.deckId} fullWidth>
                  <InputLabel>Conjunto de destino</InputLabel>
                  <Select {...field} label="Conjunto de destino">
                    <MenuItem value={0} disabled>Selecciona un conjunto</MenuItem>
                    {decks.map(deck => (
                      <MenuItem key={deck.id} value={deck.id}>{deck.name}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.deckId?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="requestedCardCount"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.requestedCardCount} fullWidth>
                  <InputLabel>Cantidad aproximada</InputLabel>
                  <Select {...field} label="Cantidad aproximada">
                    <MenuItem value={5}>5 tarjetas</MenuItem>
                    <MenuItem value={10}>10 tarjetas</MenuItem>
                    <MenuItem value={15}>15 tarjetas</MenuItem>
                    <MenuItem value={20}>20 tarjetas</MenuItem>
                  </Select>
                  <FormHelperText>{errors.requestedCardCount?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.language} fullWidth>
                  <InputLabel>Idioma</InputLabel>
                  <Select {...field} label="Idioma">
                    <MenuItem value="Español">Español</MenuItem>
                    <MenuItem value="Inglés">Inglés</MenuItem>
                    <MenuItem value="Original">Mismo idioma del documento</MenuItem>
                  </Select>
                  <FormHelperText>{errors.language?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.difficulty} fullWidth>
                  <InputLabel>Dificultad</InputLabel>
                  <Select {...field} label="Dificultad">
                    <MenuItem value="EASY">Básica</MenuItem>
                    <MenuItem value="MEDIUM">Intermedia</MenuItem>
                    <MenuItem value="HARD">Avanzada</MenuItem>
                  </Select>
                  <FormHelperText>{errors.difficulty?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="contentTypes"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.contentTypes} component="fieldset">
                  <FormLabel component="legend">Tipos de contenido</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox checked={field.value.includes('KEY_CONCEPTS')} onChange={(e) => {
                        const checked = e.target.checked;
                        field.onChange(checked ? [...field.value, 'KEY_CONCEPTS'] : field.value.filter(v => v !== 'KEY_CONCEPTS'));
                      }} />}
                      label="Conceptos principales"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={field.value.includes('DEFINITIONS')} onChange={(e) => {
                        const checked = e.target.checked;
                        field.onChange(checked ? [...field.value, 'DEFINITIONS'] : field.value.filter(v => v !== 'DEFINITIONS'));
                      }} />}
                      label="Definiciones"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={field.value.includes('ACRONYMS')} onChange={(e) => {
                        const checked = e.target.checked;
                        field.onChange(checked ? [...field.value, 'ACRONYMS'] : field.value.filter(v => v !== 'ACRONYMS'));
                      }} />}
                      label="Acrónimos"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={field.value.includes('COMPARISONS')} onChange={(e) => {
                        const checked = e.target.checked;
                        field.onChange(checked ? [...field.value, 'COMPARISONS'] : field.value.filter(v => v !== 'COMPARISONS'));
                      }} />}
                      label="Comparaciones importantes"
                    />
                  </FormGroup>
                  {errors.contentTypes && (
                    <FormHelperText>{errors.contentTypes.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={createRun.isPending}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={createRun.isPending}
            startIcon={createRun.isPending ? <CircularProgress size={20} /> : null}
          >
            {createRun.isPending ? 'Generando...' : 'Generar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
