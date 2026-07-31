import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mr: 4 }}>
            RecallPath AI
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/decks"
              startIcon={<AutoStoriesOutlinedIcon />}
              color={location.pathname.startsWith('/decks') ? 'primary' : 'inherit'}
              sx={{ fontWeight: location.pathname.startsWith('/decks') ? 'bold' : 'normal' }}
            >
              Conjuntos
            </Button>
            <Button
              component={Link}
              to="/documents"
              startIcon={<DescriptionOutlinedIcon />}
              color={location.pathname.startsWith('/documents') ? 'primary' : 'inherit'}
              sx={{ fontWeight: location.pathname.startsWith('/documents') ? 'bold' : 'normal' }}
            >
              Documentos
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}
